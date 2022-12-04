import { Name, Endian, Compression, BedrockLevel, NBTData } from "./index.js";
import { Byte, Short, Int, Float } from "./primitive.js";
import { Tag, ListTag, CompoundTag, TAG } from "./tag.js";
import { decompress } from "./compression.js";

export interface ReadOptions {
  endian?: Endian;
  compression?: Compression;
}

/**
 * Converts an NBT Uint8Array into an NBTData object. Accepts an endian type and compression format to read the data with.
 * 
 * If an option isn't provided, the function will attempt to read the data using all available formats until it either throws or returns successfully.
*/
export async function read(data: Uint8Array, { endian, compression }: ReadOptions = {}){
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
      const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
      const version = view.getUint32(0,true);
      bedrockLevel = new Int(version);
      data = data.subarray(8);
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

function hasGzipHeader(data: Uint8Array){
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  const header = view.getUint16(0,false);
  return header === 0x1F8B;
}

function hasBedrockLevelHeader(data: Uint8Array){
  const view = new DataView(data.buffer,data.byteOffset,data.byteLength);
  const byteLength = view.getUint32(4,true);
  return byteLength === data.byteLength - 8;
}

const decoder = new TextDecoder();

export interface ReaderOptions {
  endian?: Endian;
  named?: boolean;
}

/**
 * The base implementation to convert an NBT Uint8Array into an NBTData object.
*/
export class NBTReader {
  #byteOffset!: number;
  #littleEndian!: boolean;
  #data!: Uint8Array;
  #view!: DataView;

  /**
   * Initiates the reader over an uncompressed NBT Uint8Array. Accepts an endian type to read the data with. If one is not provided, big endian will be used.
  */
  read(data: Uint8Array, { endian = "big", named = true }: ReaderOptions = {}) {
    if (!(data instanceof Uint8Array)){
      throw new TypeError("First parameter must be a Uint8Array");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (typeof named !== "boolean"){
      throw new TypeError("Named option must be a boolean");
    }

    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = data;
    this.#view = new DataView(data.buffer,data.byteOffset,data.byteLength);

    const type = this.#readTagType();
    if (type !== TAG.COMPOUND){
      throw new Error(`Expected an opening Compound tag at the start of the buffer, encountered tag type ${type}`);
    }

    const name: Name = (named) ? this.#readString() : null;
    const value = this.#readCompound();

    return new NBTData(value,{ name, endian });
  }

  #readTag(type: TAG): Tag {
    switch (type){
      case TAG.END: throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}`);
      case TAG.BYTE: return new Byte(this.#readByte());
      case TAG.SHORT: return new Short(this.#readShort());
      case TAG.INT: return new Int(this.#readInt());
      case TAG.LONG: return this.#readLong();
      case TAG.FLOAT: return new Float(this.#readFloat());
      case TAG.DOUBLE: return this.#readDouble();
      case TAG.BYTE_ARRAY: return this.#readByteArray();
      case TAG.STRING: return this.#readString();
      case TAG.LIST: return this.#readList();
      case TAG.COMPOUND: return this.#readCompound();
      case TAG.INT_ARRAY: return this.#readIntArray();
      case TAG.LONG_ARRAY: return this.#readLongArray();
      default: throw new Error(`Encountered unsupported tag type ${type} at byte offset ${this.#byteOffset}`);
    }
  }

  #readTagType() {
    return this.#readUnsignedByte() as TAG;
  }

  #readUnsignedByte() {
    const value = this.#view.getUint8(this.#byteOffset);
    this.#byteOffset += 1;
    return value;
  }

  #readByte() {
    const value = this.#view.getInt8(this.#byteOffset);
    this.#byteOffset += 1;
    return value;
  }

  #readUnsignedShort() {
    const value = this.#view.getUint16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #readShort() {
    const value = this.#view.getInt16(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 2;
    return value;
  }

  #readInt() {
    const value = this.#view.getInt32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #readLong() {
    const value = this.#view.getBigInt64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readFloat() {
    const value = this.#view.getFloat32(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 4;
    return value;
  }

  #readDouble() {
    const value = this.#view.getFloat64(this.#byteOffset,this.#littleEndian);
    this.#byteOffset += 8;
    return value;
  }

  #readByteArray() {
    const byteLength = this.#readInt();
    const value = new Int8Array(this.#data.subarray(this.#byteOffset,this.#byteOffset + byteLength));
    this.#byteOffset += byteLength;
    return value;
  }

  #readString() {
    const length = this.#readUnsignedShort();
    const value = this.#data.subarray(this.#byteOffset,this.#byteOffset + length);
    this.#byteOffset += length;
    return decoder.decode(value);
  }

  #readList() {
    const tag = this.#readTagType();
    const length = this.#readInt();
    const value: ListTag = [];
    for (let i = 0; i < length; i++){
      const entry = this.#readTag(tag);
      value.push(entry);
    }
    return value;
  }

  #readCompound() {
    const value: CompoundTag = {};
    while (true){
      const tag = this.#readTagType();
      if (tag === TAG.END) break;
      const name = this.#readString();
      const entry = this.#readTag(tag);
      value[name] = entry;
    }
    return value;
  }

  #readIntArray() {
    const byteLength = this.#readInt();
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.#readInt();
      value[i] = entry;
    }
    return value;
  }

  #readLongArray() {
    const byteLength = this.#readInt();
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.#readLong();
      value[i] = entry;
    }
    return value;
  }
}