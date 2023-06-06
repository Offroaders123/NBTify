import { NBTData } from "./format.js";
import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG } from "./tag.js";
import { decompress } from "./compression.js";

import type { Name, Endian, Compression, BedrockLevel, FormatOptions } from "./format.js";
import type { RootTag, Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface ReadOptions {
  name?: boolean | Name;
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: boolean | BedrockLevel;
  strict?: boolean;
}

/**
 * Converts an NBT buffer into an NBTData object. Accepts an endian type, compression format, and file headers to read the data with.
 * 
 * If a format option isn't specified, the function will attempt reading the data using all options until it either throws or returns successfully.
*/
export async function read<T extends RootTag = any, U extends FormatOptions = FormatOptions>(data: Uint8Array | ArrayBufferLike, options?: ReadOptions): Promise<NBTData<T,U>>;
export async function read<T extends RootTag = any, U extends FormatOptions = FormatOptions>(data: Uint8Array | ArrayBufferLike, { name, endian, compression, bedrockLevel, strict }: ReadOptions = {}): Promise<NBTData<T,U>> {
  if (!("byteOffset" in data)){
    data = new Uint8Array(data);
  }

  if (!(data instanceof Uint8Array)){
    throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, or SharedArrayBuffer");
  }
  if (name !== undefined && typeof name !== "boolean" && typeof name !== "string" && name !== null){
    throw new TypeError("Name option must be a boolean, string, or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
    throw new TypeError("Compression option must be a valid compression type");
  }
  if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean" && !(bedrockLevel instanceof Int32) && bedrockLevel !== null){
    throw new TypeError("Bedrock Level option must be a boolean, Int32, or null");
  }
  if (strict !== undefined && typeof strict !== "boolean"){
    throw new TypeError("Strict option must be a boolean");
  }

  if (compression === undefined){
    switch (true){
      case hasGzipHeader(data): compression = "gzip"; break;
      case hasZlibHeader(data): compression = "deflate"; break;
      default: compression = null; break;
    }
  }

  if (endian === undefined){
    let result: NBTData<T,U>;
    try {
      result = await read<T,U>(data,{ name, endian: "big", compression, bedrockLevel, strict });
    } catch (error){
      try {
        result = await read<T,U>(data,{ name, endian: "little", compression, bedrockLevel, strict });
      } catch {
        throw error;
      }
    }
    return result;
  }

  if (name === undefined){
    let result: NBTData<T,U>;
    try {
      result = await read<T,U>(data,{ name: true, endian, compression, bedrockLevel, strict });
    } catch (error){
      try {
        result = await read<T,U>(data,{ name: false, endian, compression, bedrockLevel, strict });
      } catch {
        throw error;
      }
    }
    return result;
  }

  if (compression !== null){
    data = await decompress(data,compression);
  }

  if (bedrockLevel === undefined){
    bedrockLevel = (endian === "little" && hasBedrockLevelHeader(data));
  }

  if (bedrockLevel !== false){
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
    const version = view.getUint32(0,true);
    bedrockLevel = new Int32(version);
    data = data.subarray(8);
  } else {
    bedrockLevel = null;
  }

  const result = new NBTReader().read<T,U>(data,{ name, endian, strict });

  return new NBTData<T,U>(result,{ compression, bedrockLevel });
}

function hasGzipHeader(data: Uint8Array): boolean {
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  const header = view.getUint16(0,false);
  return header === 0x1F8B;
}

function hasZlibHeader(data: Uint8Array): boolean {
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  const header = view.getUint8(0);
  return header === 0x78;
}

function hasBedrockLevelHeader(data: Uint8Array): boolean {
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  const byteLength = view.getUint32(4,true);
  return byteLength === data.byteLength - 8;
}

interface NBTReaderOptions {
  name?: boolean | Name;
  endian?: Endian;
  strict?: boolean;
}

/**
 * The base implementation to convert an NBT buffer into an NBTData object.
*/
class NBTReader {
  #byteOffset!: number;
  #littleEndian!: boolean;
  #data!: Uint8Array;
  #view!: DataView;
  #decoder = new TextDecoder();

  /**
   * Initiates the reader over an NBT buffer.
  */
  read<T extends RootTag = any, U extends FormatOptions = FormatOptions>(data: Uint8Array | ArrayBufferLike, { name = true, endian = "big", strict = true }: NBTReaderOptions = {}): NBTData<T,U> {
    if (!("byteOffset" in data)){
      data = new Uint8Array(data);
    }

    if (!(data instanceof Uint8Array)){
      throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, or SharedArrayBuffer");
    }
    if (typeof name !== "boolean" && typeof name !== "string" && name !== null){
      throw new TypeError("Name option must be a boolean, string, or null");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (typeof strict !== "boolean"){
      throw new TypeError("Strict option must be a boolean");
    }

    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = data;
    this.#view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const type = this.#readTagType();
    if (type !== TAG.COMPOUND){
      throw new Error(`Expected an opening Compound tag at the start of the buffer, encountered tag type '${type}'`);
    }

    name = (name !== false) ? this.#readString() : null;
    const value = this.#readCompound() as T;

    if (strict && data.byteLength > this.#byteOffset){
      const remaining = data.byteLength - this.#byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
    }

    return new NBTData<T,U>(value,{ name, endian });
  }

  #allocate(byteLength: number): void {
    if (this.#byteOffset + byteLength > this.#data.byteLength){
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }

  #readTag(type: TAG): Tag {
    switch (type){
      case TAG.END: {
        const remaining = this.#data.byteLength - this.#byteOffset;
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

  #readTagType() {
    return this.#readUnsignedByte() as TAG;
  }

  #readUnsignedByte(): number {
    this.#allocate(1);
    const value = this.#view.getUint8(this.#byteOffset);
    this.#byteOffset += 1;
    return value;
  }

  #readByte(valueOf?: false): ByteTag;
  #readByte(valueOf: true): number;
  #readByte(valueOf: boolean = false): number | ByteTag {
    this.#allocate(1);
    const value = this.#view.getInt8(this.#byteOffset);
    this.#byteOffset += 1;
    return (valueOf) ? value : new Int8(value);
  }

  #readUnsignedShort(): number {
    this.#allocate(2);
    const value = this.#view.getUint16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #readShort(valueOf?: false): ShortTag;
  #readShort(valueOf: true): number;
  #readShort(valueOf: boolean = false): number | ShortTag {
    this.#allocate(2);
    const value = this.#view.getInt16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return (valueOf) ? value : new Int16(value);
  }

  #readInt(valueOf?: false): IntTag;
  #readInt(valueOf: true): number;
  #readInt(valueOf: boolean = false): number | IntTag {
    this.#allocate(4);
    const value = this.#view.getInt32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return (valueOf) ? value : new Int32(value);
  }

  #readLong(): LongTag {
    this.#allocate(8);
    const value = this.#view.getBigInt64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readFloat(valueOf?: false): FloatTag;
  #readFloat(valueOf: true): number;
  #readFloat(valueOf: boolean = false): number | FloatTag {
    this.#allocate(4);
    const value = this.#view.getFloat32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return (valueOf) ? value : new Float32(value);
  }

  #readDouble(): DoubleTag {
    this.#allocate(8);
    const value = this.#view.getFloat64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readByteArray(): ByteArrayTag {
    const length = this.#readInt(true);
    this.#allocate(length);
    const value = new Int8Array(this.#data.subarray(this.#byteOffset,this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readString(): StringTag {
    const length = this.#readUnsignedShort();
    this.#allocate(length);
    const value = this.#decoder.decode(this.#data.subarray(this.#byteOffset,this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readList(): ListTag {
    const type = this.#readTagType();
    const length = this.#readInt(true);
    const value: ListTag = [];
    for (let i = 0; i < length; i++){
      const entry = this.#readTag(type);
      value.push(entry);
    }
    return value;
  }

  #readCompound(): CompoundTag {
    const value: CompoundTag = {};
    while (true){
      const type = this.#readTagType();
      if (type === TAG.END) break;
      const name = this.#readString();
      const entry = this.#readTag(type);
      value[name] = entry;
    }
    return value;
  }

  #readIntArray(): IntArrayTag {
    const length = this.#readInt(true);
    const value = new Int32Array(length);
    for (const i in value){
      const entry = this.#readInt(true);
      value[i] = entry;
    }
    return value;
  }

  #readLongArray(): LongArrayTag {
    const length = this.#readInt(true);
    const value = new BigInt64Array(length);
    for (const i in value){
      const entry = this.#readLong();
      value[i] = entry;
    }
    return value;
  }
}