import { MUtf8Decoder } from "mutf-8";
import { NBTData } from "./format.js";
import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, TAG_TYPE, isTagType } from "./tag.js";
import { decompress } from "./compression.js";

import type { RootName, Endian, Compression, BedrockLevel } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface ReadOptions {
  rootName: boolean | RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
  strict: boolean;
  rootCheck: boolean;
}

export type Reviver = (this: any, key: any, value: any) => Tag;

/**
 * Converts an NBT buffer into an NBT object. Accepts an endian type, compression format, and file headers to read the data with.
 * 
 * If a format option isn't specified, the function will attempt reading the data using all options until it either throws or returns successfully.
*/
export async function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike | Blob, options: Partial<ReadOptions> = {}, reviver?: Reviver): Promise<NBTData<T>> {
  if (data instanceof Blob) {
    data = await data.arrayBuffer();
  }

  if (!("byteOffset" in data)) {
    data = new Uint8Array(data);
  }

  if (!(data instanceof Uint8Array)) {
    data satisfies never;
    throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, SharedArrayBuffer, or Blob");
  }

  const reader = new NBTReader(data, options.endian !== "big", options.endian === "little-varint");
  let { rootName, endian, compression, bedrockLevel, strict = true, rootCheck = true } = options;

  if (rootName !== undefined && typeof rootName !== "boolean" && typeof rootName !== "string" && rootName !== null) {
    rootName satisfies never;
    throw new TypeError("Root Name option must be a boolean, string, or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little" && endian !== "little-varint") {
    endian satisfies never;
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null) {
    compression satisfies never;
    throw new TypeError("Compression option must be a valid compression type");
  }
  if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean" && typeof bedrockLevel !== "number" && bedrockLevel !== null) {
    bedrockLevel satisfies never;
    throw new TypeError("Bedrock Level option must be a boolean, number, or null");
  }
  if (typeof strict !== "boolean") {
    strict satisfies never;
    throw new TypeError("Strict option must be a boolean");
  }

  compression: if (compression === undefined) {
    switch (true) {
      case reader.hasGzipHeader(): compression = "gzip"; break compression;
      case reader.hasZlibHeader(): compression = "deflate"; break compression;
    }
    try {
      return await read<T>(data, { ...options, compression: null }, reviver);
    } catch (error) {
      try {
        return await read<T>(data, { ...options, compression: "deflate-raw" }, reviver);
      } catch {
        throw error;
      }
    }
  }

  compression satisfies Compression;

  if (endian === undefined) {
    try {
      return await read<T>(data, { ...options, endian: "big" }, reviver);
    } catch (error) {
      try {
        return await read<T>(data, { ...options, endian: "little" }, reviver);
      } catch {
        try {
          return await read<T>(data, { ...options, endian: "little-varint" }, reviver);
        } catch {
          throw error;
        }
      }
    }
  }

  endian satisfies Endian;

  if (rootName === undefined) {
    try {
      return await read<T>(data, { ...options, rootName: true }, reviver);
    } catch (error) {
      try {
        return await read<T>(data, { ...options, rootName: false }, reviver);
      } catch {
        throw error;
      }
    }
  }

  rootName satisfies boolean | RootName;

  if (compression !== null) {
    data = await decompress(data, compression);
  }

  if (bedrockLevel === undefined) {
    bedrockLevel = reader.hasBedrockLevelHeader(endian);
  }

  return reader.readRoot<T>({ rootName, endian, compression, bedrockLevel, strict, rootCheck }, reviver);
}

class NBTReader {
  #byteOffset: number = 0;
  #data: Uint8Array;
  #view: DataView;
  readonly #littleEndian: boolean;
  readonly #varint: boolean;
  readonly #decoder: MUtf8Decoder = new MUtf8Decoder();

  constructor(data: Uint8Array, littleEndian: boolean, varint: boolean) {
    this.#data = data;
    this.#view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.#littleEndian = littleEndian;
    this.#varint = varint;
  }

  hasGzipHeader(): boolean {
    const header: number = this.#view.getUint16(0, false);
    return header === 0x1F8B;
  }

  hasZlibHeader(): boolean {
    const header: number = this.#view.getUint8(0);
    return header === 0x78;
  }

  hasBedrockLevelHeader(endian: Endian): boolean {
    if (endian !== "little" || this.#data.byteLength < 8) return false;
    const byteLength: number = this.#view.getUint32(4, true);
    return byteLength === this.#data.byteLength - 8;
  }

  #allocate(byteLength: number): void {
    if (this.#byteOffset + byteLength > this.#data.byteLength) {
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }

  async readRoot<T extends RootTagLike = RootTag>({ rootName, endian, compression, bedrockLevel, strict, rootCheck }: ReadOptions, reviver: Reviver = (_key, value) => value): Promise<NBTData<T>> {
    if (compression !== null) {
      this.#data = await decompress(this.#data, compression);
      this.#view = new DataView(this.#data.buffer);
    }

    if (bedrockLevel) {
      // const version =
        this.#readUnsignedInt();
      this.#readUnsignedInt();
    }

    const type: TAG = this.#readTagType();
    if (rootCheck && type !== TAG.LIST && type !== TAG.COMPOUND) {
      throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
    }

    const rootNameV: RootName = typeof rootName === "string" || rootName ? this.#readString() : null;
    if (typeof rootName === "string" && rootNameV !== rootName) {
      throw new Error(`Expected root name '${rootName}', encountered '${rootNameV}'`);
    }

    const root: T = reviver("", this.#readTag<T>(type, reviver)) as T;

    if (strict && this.#data.byteLength > this.#byteOffset) {
      const remaining: number = this.#data.byteLength - this.#byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
    }

    const result: NBTData<T> = new NBTData<T>(root, { rootName: rootNameV, endian, compression, bedrockLevel });

    if (!strict) {
      result.byteOffset = this.#byteOffset;
    }

    return result;
  }

  #readTag<T extends Tag>(type: TAG, reviver: Reviver): T;
  #readTag<T extends RootTagLike>(type: TAG, reviver: Reviver): T;
  #readTag(type: TAG, reviver: Reviver): Tag {
    switch (type) {
      case TAG.END: {
        const remaining: number = this.#data.byteLength - this.#byteOffset;
        throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
      }
      case TAG.BYTE: return this.#readByte();
      case TAG.SHORT: return this.#readShort();
      case TAG.INT: return this.#varint ? this.#readVarIntZigZag() : this.#readInt();
      case TAG.LONG: return this.#varint ? this.#readVarLongZigZag() : this.#readLong();
      case TAG.FLOAT: return this.#readFloat();
      case TAG.DOUBLE: return this.#readDouble();
      case TAG.BYTE_ARRAY: return this.#readByteArray();
      case TAG.STRING: return this.#readString();
      case TAG.LIST: return this.#readList(reviver);
      case TAG.COMPOUND: return this.#readCompound(reviver);
      case TAG.INT_ARRAY: return this.#readIntArray();
      case TAG.LONG_ARRAY: return this.#readLongArray();
      default: throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${this.#byteOffset}`);
    }
  }

  #readTagType(): TAG {
    const type: number = this.#readUnsignedByte();
    if (!isTagType(type)) {
      throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${this.#byteOffset}`);
    }
    return type;
  }

  #readUnsignedByte(): number {
    this.#allocate(1);
    const value: number = this.#view.getUint8(this.#byteOffset);
    this.#byteOffset += 1;
    return value;
  }

  #readByte(valueOf?: false): ByteTag;
  #readByte(valueOf: true): number;
  #readByte(valueOf: boolean = false): number | ByteTag {
    this.#allocate(1);
    const value: number = this.#view.getInt8(this.#byteOffset);
    this.#byteOffset += 1;
    return (valueOf) ? value : new Int8(value);
  }

  #readUnsignedShort(): number {
    this.#allocate(2);
    const value: number = this.#view.getUint16(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #readShort(valueOf?: false): ShortTag;
  #readShort(valueOf: true): number;
  #readShort(valueOf: boolean = false): number | ShortTag {
    this.#allocate(2);
    const value: number = this.#view.getInt16(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 2;
    return (valueOf) ? value : new Int16(value);
  }

  #readUnsignedInt(): number {
    this.#allocate(4);
    const value: number = this.#view.getUint32(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #readInt(valueOf?: false): IntTag;
  #readInt(valueOf: true): number;
  #readInt(valueOf: boolean = false): number | IntTag {
    this.#allocate(4);
    const value: number = this.#view.getInt32(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 4;
    return (valueOf) ? value : new Int32(value);
  }

  #readVarInt(): number {
    let value: number = 0;
    let shift: number = 0;
    let byte: number;
    while (true) {
      byte = this.#readByte(true);
      value |= (byte & 0x7F) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return value;
  }

  #readVarIntZigZag(valueOf?: false): IntTag;
  #readVarIntZigZag(valueOf: true): number;
  #readVarIntZigZag(valueOf: boolean = false): number | IntTag {
    let result: number = 0;
    let shift: number = 0;
    while (true) {
      this.#allocate(1);
      const byte: number = this.#readByte(true);
      result |= ((byte & 0x7F) << shift);
      if (!(byte & 0x80)) break;
      shift += 7;
      if (shift > 63) {
        throw new Error(`VarInt size '${shift}' at byte offset ${this.#byteOffset} is too large`);
      }
    }
    const zigzag: number = ((((result << 63) >> 63) ^ result) >> 1) ^ (result & (1 << 63));
    return valueOf ? zigzag : new Int32(zigzag);
  }

  #readLong(): LongTag {
    this.#allocate(8);
    const value: bigint = this.#view.getBigInt64(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readVarLongZigZag(): LongTag {
    let result: bigint = 0n;
    let shift: bigint = 0n;
    while (true) {
      this.#allocate(1);
      const byte: number = this.#readByte(true);
      result |= (BigInt(byte) & 0x7Fn) << shift;
      if (!(byte & 0x80)) break;
      shift += 7n;
      if (shift > 63n) {
        throw new Error(`VarLong size '${shift}' at byte offset ${this.#byteOffset} is too large`);
      }
    }
    const zigzag: bigint = (result >> 1n) ^ -(result & 1n);
    return zigzag;
  }

  #readFloat(valueOf?: false): FloatTag;
  #readFloat(valueOf: true): number;
  #readFloat(valueOf: boolean = false): number | FloatTag {
    this.#allocate(4);
    const value: number = this.#view.getFloat32(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 4;
    return (valueOf) ? value : new Float32(value);
  }

  #readDouble(): DoubleTag {
    this.#allocate(8);
    const value: number = this.#view.getFloat64(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readByteArray(): ByteArrayTag {
    const length: number = this.#varint ? this.#readVarIntZigZag(true) : this.#readInt(true);
    this.#allocate(length);
    const value = new Int8Array(this.#data.subarray(this.#byteOffset, this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readString(): StringTag {
    const length: number = this.#varint ? this.#readVarInt() : this.#readUnsignedShort();
    this.#allocate(length);
    const value: string = this.#decoder.decode(this.#data.subarray(this.#byteOffset, this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readList(reviver: Reviver): ListTag<Tag> {
    const type: TAG = this.#readTagType();
    const length: number = this.#varint ? this.#readVarIntZigZag(true) : this.#readInt(true);
    const value: ListTag<Tag> = [];
    Object.defineProperty(value, TAG_TYPE, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: type
    });
    for (let i: number = 0; i < length; i++) {
      const entry: Tag = reviver(i, this.#readTag(type, reviver));
      value.push(entry);
    }
    return value;
  }

  #readCompound(reviver: Reviver): CompoundTag {
    const value: CompoundTag = {};
    while (true) {
      const type: TAG = this.#readTagType();
      if (type === TAG.END) break;
      const name: string = this.#readString();
      const entry: Tag = reviver(name, this.#readTag(type, reviver));
      value[name] = entry;
    }
    return value;
  }

  #readIntArray(): IntArrayTag {
    const length: number = this.#varint ? this.#readVarIntZigZag(true) : this.#readInt(true);
    const value = new Int32Array(length);
    for (const i in value) {
      const entry: number = this.#readInt(true);
      value[i] = entry;
    }
    return value;
  }

  #readLongArray(): LongArrayTag {
    const length: number = this.#varint ? this.#readVarIntZigZag(true) : this.#readInt(true);
    const value = new BigInt64Array(length);
    for (const i in value) {
      const entry: bigint = this.#readLong();
      value[i] = entry;
    }
    return value;
  }
}