import { NBTData } from "./format.js";
import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG } from "./tag.js";
import { decompress } from "./compression.js";

import type { Name, Endian, Compression, BedrockLevel } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

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
export async function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike, options?: ReadOptions): Promise<NBTData<T>>;
export async function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike, { name, endian, compression, bedrockLevel, strict }: ReadOptions = {}): Promise<NBTData<T>> {
  if (!("byteOffset" in data)){
    data = new Uint8Array(data);
  }

  if (!(data instanceof Uint8Array)){
    throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, or SharedArrayBuffer");
  }
  if (name !== undefined && typeof name !== "boolean" && typeof name !== "string" && name !== null){
    throw new TypeError("Name option must be a boolean, string, or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little" && endian !== "little-varint"){
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

  compression: if (compression === undefined){
    switch (true){
      case hasGzipHeader(data): compression = "gzip"; break compression;
      case hasZlibHeader(data): compression = "deflate"; break compression;
    }
    try {
      return await read<T>(data,{ name, endian, compression: null, bedrockLevel, strict });
    } catch (error){
      try {
        return await read<T>(data,{ name, endian, compression: "deflate-raw", bedrockLevel, strict });
      } catch {
        throw error;
      }
    }
  }

  if (endian === undefined){
    try {
      return await read<T>(data,{ name, endian: "big", compression, bedrockLevel, strict });
    } catch (error){
      try {
        return await read<T>(data,{ name, endian: "little", compression, bedrockLevel, strict });
      } catch {
        try {
          return await read<T>(data,{ name, endian: "little-varint", compression, bedrockLevel, strict });
        } catch {
          throw error;
        }
      }
    }
  }

  if (name === undefined){
    try {
      return await read<T>(data,{ name: true, endian, compression, bedrockLevel, strict });
    } catch (error){
      try {
        return await read<T>(data,{ name: false, endian, compression, bedrockLevel, strict });
      } catch {
        throw error;
      }
    }
  }

  if (compression !== null){
    data = await decompress(data,compression);
  }

  if (bedrockLevel === undefined){
    bedrockLevel = (endian !== "big" && hasBedrockLevelHeader(data));
  }

  if (bedrockLevel !== false && bedrockLevel !== null){
    const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
    const version = view.getUint32(0,true);
    bedrockLevel = new Int32(version);
    data = data.subarray(8);
  } else {
    bedrockLevel = null;
  }

  const result = new NBTReader().read<T>(data,{ name, endian, strict });

  return new NBTData<T>(result,{ compression, bedrockLevel });
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

export interface NBTReaderOptions {
  name?: boolean | Name;
  endian?: Endian;
  strict?: boolean;
}

/**
 * The base implementation to convert an NBT buffer into an NBTData object.
*/
export class NBTReader {
  #byteOffset!: number;
  #littleEndian!: boolean;
  #varint!: boolean;
  #data!: Uint8Array;
  #view!: DataView;
  #decoder = new TextDecoder();

  /**
   * Initiates the reader over an NBT buffer.
  */
  read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike, options?: NBTReaderOptions): NBTData<T>;
  read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike, { name = true, endian = "big", strict = true }: NBTReaderOptions = {}): NBTData<T> {
    if (!("byteOffset" in data)){
      data = new Uint8Array(data);
    }

    if (!(data instanceof Uint8Array)){
      throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, or SharedArrayBuffer");
    }
    if (typeof name !== "boolean" && typeof name !== "string" && name !== null){
      throw new TypeError("Name option must be a boolean, string, or null");
    }
    if (endian !== "big" && endian !== "little" && endian !== "little-varint"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (typeof strict !== "boolean"){
      throw new TypeError("Strict option must be a boolean");
    }

    this.#byteOffset = 0;
    this.#littleEndian = (endian !== "big");
    this.#varint = (endian === "little-varint");
    this.#data = data;
    this.#view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    let value: T;
    [name,value] = this.#readRoot(name) as [Name,T];

    if (strict && data.byteLength > this.#byteOffset){
      const remaining = data.byteLength - this.#byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
    }

    return new NBTData<T>(value,{ name, endian });
  }

  #allocate(byteLength: number): void {
    if (this.#byteOffset + byteLength > this.#data.byteLength){
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }

  #readRoot<T extends RootTag>(name: boolean | Name): [Name,T] {
    const type = this.#readTagType();
    if (type !== TAG.LIST && type !== TAG.COMPOUND){
      throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
    }

    name = (name !== false) ? this.#readString() : null;
    let value: T;

    switch (type){
      case 9: value = this.#readList() as T; break;
      case 10: value = this.#readCompound() as T; break;
    }

    return [name,value];
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
    console.log("short doesn't throw");
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
    if (this.#littleEndian && this.#varint && !valueOf){
      console.log("var");
      return this.#readVarInt();
    }
    this.#allocate(4);
    const value = this.#view.getInt32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return (valueOf) ? value : new Int32(value);
  }

  #readVarInt(): IntTag {
    let value = 0;
    let position = 0;
    let currentByte = 0;

    while (true){
      currentByte = this.#readByte(true);
      value |= (currentByte & 0x7F) << position;

      if ((currentByte & 0x80) === 0) break;

      position += 7;

      if (position >= 32) throw new RangeError("VarInt is too big");
    }

    return new Int32(value);
  }

  #readLong(): LongTag {
    if (this.#littleEndian && this.#varint){
      console.log("var");
      return this.#readVarLong();
    }
    this.#allocate(8);
    const value = this.#view.getBigInt64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readVarLong(): LongTag {
    let value = 0n;
    let position = 0n;
    let currentByte = 0n;

    while (true){
      currentByte = BigInt(this.#readByte(true));
      value |= (currentByte & 0x7Fn) << position;

      if ((currentByte & 0x80n) === 0n) break;

      position += 7n;

      if (position >= 64n) throw new RangeError("VarLong is too big");
    }

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
    console.log(this.#data.slice(0,this.#byteOffset));
    console.log(`string's length - ShortTag value: ${length}`);
    this.#allocate(length);
    const value = this.#decoder.decode(this.#data.subarray(this.#byteOffset,this.#byteOffset + length));
    this.#byteOffset += length;
    return value;
  }

  #readList(): ListTag<Tag> {
    const type = this.#readTagType();
    const length = this.#readInt(true);
    const value: ListTag<Tag> = [];
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