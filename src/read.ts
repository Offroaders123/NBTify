import { MUtf8Decoder } from "mutf-8";
import { NBTData } from "./format.js";
import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, TAG_TYPE, isTagType } from "./tag.js";
import { decompress } from "./compression.js";
import { NBTError } from "./error.js";

import type { RootName, Endian, Compression, BedrockLevel } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface ReadOptions {
  rootName: boolean | RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
  strict: boolean;
}

/**
 * Converts an NBT buffer into an NBT object. Accepts an endian type, compression format, and file headers to read the data with.
 * 
 * If a format option isn't specified, the function will attempt reading the data using all options until it either throws or returns successfully.
*/
export async function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike | Blob, options: Partial<ReadOptions> = {}): Promise<NBTData<T>> {
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

  const reader = new NBTReader(data, options.endian === "little");
  let { rootName, endian, compression, bedrockLevel, strict = true } = options;

  if (rootName !== undefined && typeof rootName !== "boolean" && typeof rootName !== "string" && rootName !== null) {
    rootName satisfies never;
    throw new TypeError("Root Name option must be a boolean, string, or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little") {
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
      return await read<T>(data, { ...options, compression: null });
    } catch (error) {
      try {
        return await read<T>(data, { ...options, compression: "deflate-raw" });
      } catch {
        throw error;
      }
    }
  }

  compression satisfies Compression;

  if (endian === undefined) {
    try {
      return await read<T>(data, { ...options, endian: "big" });
    } catch (error) {
      try {
        return await read<T>(data, { ...options, endian: "little" });
      } catch {
        throw error;
      }
    }
  }

  endian satisfies Endian;

  if (rootName === undefined) {
    try {
      return await read<T>(data, { ...options, rootName: true });
    } catch (error) {
      try {
        return await read<T>(data, { ...options, rootName: false });
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

  return reader.readRoot<T>({ rootName, endian, compression, bedrockLevel, strict });
}

class NBTReader {
  #byteOffset: number = 0;
  #data: Uint8Array;
  #view: DataView;
  readonly #littleEndian: boolean;
  readonly #decoder: MUtf8Decoder = new MUtf8Decoder();

  constructor(data: Uint8Array, littleEndian: boolean) {
    this.#data = data;
    this.#view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.#littleEndian = littleEndian;
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

  async readRoot<T extends RootTagLike = RootTag>({ rootName, endian, compression, bedrockLevel, strict }: ReadOptions): Promise<NBTData<T>> {
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
    if (type !== TAG.LIST && type !== TAG.COMPOUND) {
      throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
    }

    const rootNameV: RootName = typeof rootName === "string" || rootName ? this.#readString() : null;
    const root: T = this.#readTag<T>(type);

    if (strict && this.#data.byteLength > this.#byteOffset) {
      const remaining: number = this.#data.byteLength - this.#byteOffset;
      throw new NBTError(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`, { byteOffset: this.#byteOffset, cause: new NBTData<RootTag>(root as RootTag, { rootName: rootNameV, endian }), remaining });
    }

    return new NBTData(root, { rootName: rootNameV, endian, compression, bedrockLevel });
  }

  #readTag<T extends Tag>(type: TAG): T;
  #readTag<T extends RootTagLike>(type: TAG): T;
  #readTag(type: TAG): Tag {
    switch (type) {
      case TAG.END: {
        const remaining: number = this.#data.byteLength - this.#byteOffset;
        throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
      }
      case TAG.BYTE: return this.#readByte();
      case TAG.SHORT: return this.#readShort();
      case TAG.INT: return this.#readInt();
      case TAG.LONG: return this.#readLong();
      case TAG.FLOAT: return this.#readFloat();
      case TAG.DOUBLE: return this.#readDouble();
      case TAG.BYTE_ARRAY: return this.#readByteArray();
      case TAG.STRING: return this.#readString();
      case TAG.LIST: return this.#readList();
      case TAG.COMPOUND: return this.#readCompound();
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

  #readLong(): LongTag {
    this.#allocate(8);
    const value: bigint = this.#view.getBigInt64(this.#byteOffset, this.#littleEndian);
    this.#byteOffset += 8;
    return value;
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
    const length: number = this.#readInt(true);
    this.#allocate(length);
    const value = new Int8Array(this.#data.subarray(this.#byteOffset, this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readString(): StringTag {
    const length: number = this.#readUnsignedShort();
    this.#allocate(length);
    const value: string = this.#decoder.decode(this.#data.subarray(this.#byteOffset, this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readList(): ListTag<Tag> {
    const type: TAG = this.#readTagType();
    const length: number = this.#readInt(true);
    const value: ListTag<Tag> = [];
    Object.defineProperty(value, TAG_TYPE, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: type
    });
    for (let i: number = 0; i < length; i++) {
      const entry: Tag = this.#readTag(type);
      value.push(entry);
    }
    return value;
  }

  #readCompound(): CompoundTag {
    const value: CompoundTag = {};
    while (true) {
      const type: TAG = this.#readTagType();
      if (type === TAG.END) break;
      const name: string = this.#readString();
      const entry: Tag = this.#readTag(type);
      value[name] = entry;
    }
    return value;
  }

  #readIntArray(): IntArrayTag {
    const length: number = this.#readInt(true);
    const value = new Int32Array(length);
    for (const i in value) {
      const entry: number = this.#readInt(true);
      value[i] = entry;
    }
    return value;
  }

  #readLongArray(): LongArrayTag {
    const length: number = this.#readInt(true);
    const value = new BigInt64Array(length);
    for (const i in value) {
      const entry: bigint = this.#readLong();
      value[i] = entry;
    }
    return value;
  }
}