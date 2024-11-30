import { MUtf8Encoder } from "mutf-8";
import { NBTData } from "./format.js";
import { TAG, TAG_TYPE, isTag, getTagType } from "./tag.js";
import { Int32 } from "./primitive.js";
import { compress } from "./compression.js";

import type { NBTDataOptions } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export type Replacer<P = any> = (this: P, key: any, value: any) => Tag;

/**
 * Converts an NBT object into an NBT buffer. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If a format option isn't specified, the value of the equivalent property on the NBTData object will be used.
*/
export async function write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options: NBTDataOptions & { rootCheck?: boolean; } = {}, replacer?: Replacer): Promise<Uint8Array> {
  data = new NBTData(data, options);

  const { rootName, endian, compression, bedrockLevel } = data as NBTData<T>;
  const rootCheck: boolean = options.rootCheck ?? true;

  if (rootCheck && typeof data !== "object" || data === null) {
    data satisfies never;
    throw new TypeError("First parameter must be an object or array");
  }
  if (rootName !== undefined && typeof rootName !== "string" && rootName !== null) {
    rootName satisfies never;
    throw new TypeError("Root Name option must be a string or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little" && endian !== "little-varint") {
    endian satisfies never;
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null) {
    compression satisfies never;
    throw new TypeError("Compression option must be a valid compression type");
  }
  if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean") {
    bedrockLevel satisfies never;
    throw new TypeError("Bedrock Level option must be a boolean");
  }

  const writer = new NBTWriter(endian !== "big", endian === "little-varint", replacer);
  return writer.writeRoot(data as NBTData<T>, rootCheck);
}

class NBTWriter {
  #byteOffset: number = 0;
  #data: Uint8Array = new Uint8Array(1024);
  #view: DataView = new DataView(this.#data.buffer);
  readonly #littleEndian: boolean;
  readonly #varint: boolean;
  readonly #encoder: MUtf8Encoder = new MUtf8Encoder();
  readonly #replacer: Replacer<CompoundTag | ListTag<Tag>>;

  constructor(littleEndian: boolean, varint: boolean, replacer?: Replacer) {
    this.#littleEndian = littleEndian;
    this.#varint = varint;
    this.#replacer = replacer !== undefined ? replacer : (_key, value) => value;
  }

  #allocate(byteLength: number): void {
    const required: number = this.#byteOffset + byteLength;
    if (this.#data.byteLength >= required) return;

    let length: number = this.#data.byteLength;

    while (length < required) {
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.#data, 0);

    // not sure this is really needed, keeping it just in case; freezer burn
    if (this.#byteOffset > this.#data.byteLength) {
      data.fill(0, byteLength, this.#byteOffset);
    }

    this.#data = data;
    this.#view = new DataView(data.buffer);
  }

  #trimmedEnd(): Uint8Array {
    this.#allocate(0);
    return this.#data.slice(0, this.#byteOffset);
  }

  async writeRoot<T extends RootTagLike = RootTag>(data: NBTData<T>, rootCheck: boolean): Promise<Uint8Array> {
    const { data: root, rootName, endian, compression, bedrockLevel } = data;
    const littleEndian: boolean = endian !== "big";
    const type: TAG | null = getTagType(root);
    if (type === null || rootCheck && type !== TAG.LIST && type !== TAG.COMPOUND) {
      throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
    }

    if (bedrockLevel) {
      this.#writeUnsignedInt(0);
      this.#writeUnsignedInt(0);
    }

    this.#writeTagType(type);
    if (rootName !== null) this.#writeString(rootName);
    this.#writeTag(this.#replacer.call({ "": root as RootTag }, "", root as RootTag));

    if (bedrockLevel) {
      if (littleEndian !== true) {
        throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
      }
      if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)) {
        throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
      }
      const version: number = root["StorageVersion"].valueOf();
      const byteLength: number = this.#byteOffset - 8;
      this.#view.setUint32(0, version, littleEndian);
      this.#view.setUint32(4, byteLength, littleEndian);
    }

    let result: Uint8Array = this.#trimmedEnd();

    if (compression !== null) {
      result = await compress(result, compression);
    }

    return result;
  }

  #writeTag(value: Tag): this {
    const type: TAG = getTagType(value);
    switch (type) {
      case TAG.BYTE: return this.#writeByte(value as ByteTag | BooleanTag);
      case TAG.SHORT: return this.#writeShort(value as ShortTag);
      case TAG.INT: return this.#varint ? this.#writeVarIntZigZag(value as IntTag) : this.#writeInt(value as IntTag);
      case TAG.LONG: return this.#varint ? this.#writeVarLongZigZag(value as LongTag) : this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat(value as FloatTag);
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTag<Tag>);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag);
      default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
  }

  #writeTagType(type: TAG): this {
    this.#writeUnsignedByte(type);
    return this;
  }

  #writeUnsignedByte(value: number): this {
    this.#allocate(1);
    this.#view.setUint8(this.#byteOffset, value);
    this.#byteOffset += 1;
    return this;
  }

  #writeByte(value: number | ByteTag | BooleanTag): this {
    this.#allocate(1);
    this.#view.setInt8(this.#byteOffset, Number(value.valueOf()));
    this.#byteOffset += 1;
    return this;
  }

  #writeUnsignedShort(value: number): this {
    this.#allocate(2);
    this.#view.setUint16(this.#byteOffset, value, this.#littleEndian);
    this.#byteOffset += 2;
    return this;
  }

  #writeShort(value: number | ShortTag): this {
    this.#allocate(2);
    this.#view.setInt16(this.#byteOffset, value.valueOf(), this.#littleEndian);
    this.#byteOffset += 2;
    return this;
  }

  #writeUnsignedInt(value: number): this {
    this.#allocate(4);
    this.#view.setUint32(this.#byteOffset, value, this.#littleEndian);
    this.#byteOffset += 4;
    return this;
  }

  #writeInt(value: number | IntTag): this {
    this.#allocate(4);
    this.#view.setInt32(this.#byteOffset, value.valueOf(), this.#littleEndian);
    this.#byteOffset += 4;
    return this;
  }

  #writeVarInt(value: number): this {
    while (true) {
      let byte: number = value & 0x7F;
      value >>>= 7;
      if (value !== 0) {
        byte |= 0x80;
      }
      this.#writeByte(byte);
      if (value === 0) break;
    }
    return this;
  }

  #writeVarIntZigZag(value: number | IntTag): this {
    value = value.valueOf();
    value = (value << 1) ^ (value >> 31);
    while (value & ~0x7F) {
      const byte: number = (value & 0xFF) | 0x80;
      this.#writeByte(byte);
      value >>>= 7;
    }
    this.#writeByte(value);
    return this;
  }

  #writeLong(value: LongTag): this {
    this.#allocate(8);
    this.#view.setBigInt64(this.#byteOffset, value, this.#littleEndian);
    this.#byteOffset += 8;
    return this;
  }

  #writeVarLongZigZag(value: LongTag): this {
    value = (value << 1n) ^ (value >> 63n);
    while (value > 127n) {
      const byte: number = Number(value & 0xFFn);
      this.#writeByte(byte | 0x80);
      value >>= 7n;
    }
    this.#writeByte(Number(value));
    return this;
  }

  #writeFloat(value: number | FloatTag): this {
    this.#allocate(4);
    this.#view.setFloat32(this.#byteOffset, value.valueOf(), this.#littleEndian);
    this.#byteOffset += 4;
    return this;
  }

  #writeDouble(value: DoubleTag): this {
    this.#allocate(8);
    this.#view.setFloat64(this.#byteOffset, value, this.#littleEndian);
    this.#byteOffset += 8;
    return this;
  }

  #writeByteArray(value: ByteArrayTag): this {
    const { length } = value;
    this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
    this.#allocate(length);
    this.#data.set(value, this.#byteOffset);
    this.#byteOffset += length;
    return this;
  }

  #writeString(value: StringTag): this {
    const entry: Uint8Array = this.#encoder.encode(value);
    const { length } = entry;
    this.#varint ? this.#writeVarInt(length) : this.#writeUnsignedShort(length);
    this.#allocate(length);
    this.#data.set(entry, this.#byteOffset);
    this.#byteOffset += length;
    return this;
  }

  #writeList(value: ListTag<Tag>): this {
    let type: TAG | undefined = value[TAG_TYPE];
    value = value.filter(isTag);
    type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
    const { length } = value;
    this.#writeTagType(type);
    this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
    for (let i: number = 0; i < value.length; i++) {
      const entry: Tag = value[i]!;
      if (getTagType(entry) !== type) {
        throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
      }
      this.#writeTag(this.#replacer.call(value, String(i), entry));
    }
    return this;
  }

  #writeCompound(value: CompoundTag): this {
    for (const [name, entry] of Object.entries(value)) {
      if (entry === undefined) continue;
      const type: TAG | null = getTagType(entry as unknown);
      if (type === null) continue;
      this.#writeTagType(type);
      this.#writeString(name);
      this.#writeTag(this.#replacer.call(value, name, entry));
    }
    this.#writeTagType(TAG.END);
    return this;
  }

  #writeIntArray(value: IntArrayTag): this {
    const { length } = value;
    this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
    for (const entry of value) {
      this.#writeInt(entry);
    }
    return this;
  }

  #writeLongArray(value: LongArrayTag): this {
    const { length } = value;
    this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
    for (const entry of value) {
      this.#writeLong(entry);
    }
    return this;
  }
}