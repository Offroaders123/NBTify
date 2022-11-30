import { NBTData, Endian, Compression, BedrockLevel } from "./index.js";
import { Byte, Short, Int, Float } from "./primitive.js";
import { Tag, ListTag, CompoundTag, TAG } from "./tag.js";
import { decompress } from "./compression.js";

export interface NBTReadOptions {
  endian?: Endian;
  compression?: Compression;
}

/**
 * Converts an NBT Uint8Array into an NBTData object. Accepts an endian type and compression format to read the data with.
 * 
 * If an option isn't provided, the function will attempt to read the data using all available formats until it either throws or returns successfully.
*/
export async function read(data: Uint8Array, { endian, compression }: NBTReadOptions = {}){
  if (!(data instanceof Uint8Array)){
    throw new TypeError("First parameter must be a Uint8Array");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "gzip" && compression !== "zlib"){
    throw new TypeError("Compression option must be a valid compression type");
  }

  if (endian !== undefined){
    let bedrockLevel: BedrockLevel | undefined;

    if (endian !== "big" && hasBedrockLevelHeader(data)){
      const view = new DataView(data.buffer);
      const version = view.getUint32(0,true);
      bedrockLevel = new Int(version);
      data = data.slice(8);
    }
    if (compression === "gzip" || hasGzipHeader(data)){
      compression = "gzip";
      data = await decompress(data,{ format: "gzip" });
    }

    const reader = new NBTReader();
    const result = reader.read(data,{ endian });

    return new NBTData(result,{ compression, bedrockLevel });
  } else {
    let result: NBTData;
    try {
      result = await read(data,{ endian: "big", compression });
    } catch (error){
      try {
        result = await read(data,{ endian: "little", compression });
      } catch {
        throw error;
      }
    }
    return result;
  }
}

export function hasGzipHeader(data: Uint8Array) {
  if (!(data instanceof Uint8Array)){
    throw new TypeError("First parameter must be a Uint8Array");
  }

  const view = new DataView(data.buffer);
  const header = view.getUint16(0,false);
  return header === 0x1f8b;
}

export function hasBedrockLevelHeader(data: Uint8Array) {
  if (!(data instanceof Uint8Array)){
    throw new TypeError("First parameter must be a Uint8Array");
  }

  const view = new DataView(data.buffer);
  const byteLength = view.getUint32(4,true);
  return byteLength === data.byteLength - 8;
}

export interface NBTReaderOptions {
  named?: boolean;
  endian?: Endian;
}

/**
 * The base implementation to convert an NBT Uint8Array into an NBTData object.
*/
export class NBTReader {
  #byteOffset = 0;
  #littleEndian = false;
  #data = new Uint8Array();
  #view = new DataView(this.#data.buffer);

  /**
   * Initiates the reader over an uncompressed NBT Uint8Array. Accepts an endian type to read the data with. If one is not provided, big endian will be used.
  */
  read(data: Uint8Array, { named = true, endian = "big" }: NBTReaderOptions = {}) {
    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = new Uint8Array(data);
    this.#view = new DataView(this.#data.buffer);

    const tag = this.#getTagType();
    if (tag !== TAG.COMPOUND){
      throw new TypeError(`Encountered unsupported tag type ${tag}`);
    }

    const name = (named) ? this.#getString() : null;
    const value = this.#getCompound();

    return new NBTData(value,{ name, endian });
  }

  #getTag(tag: TAG): Tag {
    switch (tag){
      case TAG.BYTE: return new Byte(this.#getByte());
      case TAG.SHORT: return new Short(this.#getShort());
      case TAG.INT: return new Int(this.#getInt());
      case TAG.LONG: return this.#getLong();
      case TAG.FLOAT: return new Float(this.#getFloat());
      case TAG.DOUBLE: return this.#getDouble();
      case TAG.BYTE_ARRAY: return this.#getByteArray();
      case TAG.STRING: return this.#getString();
      case TAG.LIST: return this.#getList();
      case TAG.COMPOUND: return this.#getCompound();
      case TAG.INT_ARRAY: return this.#getIntArray();
      case TAG.LONG_ARRAY: return this.#getLongArray();
      default: throw new TypeError(`Encountered unsupported tag ${tag}`);
    }
  }

  #getTagType() {
    const value = this.#view.getUint8(this.#byteOffset);
    this.#byteOffset += 1;
    return value as TAG;
  }

  #getByte() {
    const value = this.#view.getInt8(this.#byteOffset);
    this.#byteOffset += 1;
    return value;
  }

  #getUnsignedShort() {
    const value = this.#view.getUint16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #getShort() {
    const value = this.#view.getInt16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #getUnsignedInt() {
    const value = this.#view.getUint32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #getInt() {
    const value = this.#view.getInt32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #getLong() {
    const value = this.#view.getBigInt64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #getFloat() {
    const value = this.#view.getFloat32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #getDouble() {
    const value = this.#view.getFloat64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #getByteArray() {
    const byteLength = this.#getUnsignedInt();
    const value = new Int8Array(this.#data.slice(this.#byteOffset,this.#byteOffset + byteLength));
    this.#byteOffset += byteLength;
    return value;
  }

  #getString() {
    const length = this.#getUnsignedShort();
    const value = this.#data.slice(this.#byteOffset,this.#byteOffset + length);
    this.#byteOffset += length;
    return new TextDecoder().decode(value);
  }

  #getList() {
    const tag = this.#getTagType();
    const length = this.#getUnsignedInt();
    const value: ListTag = [];
    for (let i = 0; i < length; i++){
      const entry = this.#getTag(tag);
      value.push(entry);
    }
    return value;
  }

  #getCompound() {
    const value: CompoundTag = {};
    while (true){
      const tag = this.#getTagType();
      if (tag === TAG.END) break;
      const name = this.#getString();
      const entry = this.#getTag(tag);
      value[name] = entry;
    }
    return value;
  }

  #getIntArray() {
    const byteLength = this.#getUnsignedInt();
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.#getInt();
      value[i] = entry;
    }
    return value;
  }

  #getLongArray() {
    const byteLength = this.#getUnsignedInt();
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.#getLong();
      value[i] = entry;
    }
    return value;
  }
}