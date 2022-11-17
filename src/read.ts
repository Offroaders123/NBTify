import { Metadata, NBTData } from "./index.js";
import { Byte, Short, Int, Float } from "./primitive.js";
import { Tag, ListTag, CompoundTag, TAG_TYPE, TAG_END, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY } from "./tag.js";
import { decompress } from "./compression.js";

type ReadOptions = Partial<Pick<Metadata,"endian" | "compression">>;

/**
 * Converts an NBT Uint8Array into an NBTData object. Accepts an endian type and compression format to read the data with.
 * 
 * If an option isn't provided, the function will attempt to read the data using all available formats until it either throws or returns successfully.
*/
export async function read(data: Uint8Array, { endian, compression }: ReadOptions = {}){
  if (!(data instanceof Uint8Array)){
    throw new TypeError("First argument must be a Uint8Array");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    throw new TypeError(`Endian option must be set to either "big" or "little"`);
  }
  if (compression !== undefined && compression !== "none" && compression !== "gzip" && compression !== "zlib"){
    throw new TypeError(`Compression option must be set to either "none", "gzip", or "zlib"`);
  }

  if (endian !== undefined){
    let bedrockLevel: Metadata["bedrockLevel"] = false;

    if (endian !== "big" && NBTReader.hasBedrockLevelHeader(data)){
      const view = new DataView(data.buffer);
      const version = view.getUint32(0,true);
      bedrockLevel = new Int(version);
      data = data.slice(8);
    }
    if (compression === "gzip" || NBTReader.hasGzipHeader(data)){
      compression = "gzip";
      data = await decompress(data,{ format: "gzip" });
    }

    const reader = new NBTReader();
    const result = reader.read(data,{ endian });

    result.compression = compression || "none";
    result.bedrockLevel = bedrockLevel;

    return result;
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

type ReaderOptions = Partial<Pick<Metadata,"endian">>;

/**
 * The base implementation to convert an NBT Uint8Array into an NBTData object.
*/
export class NBTReader {
  static hasGzipHeader(data: Uint8Array) {
    if (!(data instanceof Uint8Array)){
      throw new TypeError("First argument must be a Uint8Array");
    }
    const view = new DataView(data.buffer);
    const header = view.getUint16(0,false);
    return header === 0x1f8b;
  }

  static hasBedrockLevelHeader(data: Uint8Array) {
    if (!(data instanceof Uint8Array)){
      throw new TypeError("First argument must be a Uint8Array");
    }
    const view = new DataView(data.buffer);
    const byteLength = view.getUint32(4,true);
    return byteLength === data.byteLength - 8;
  }

  #offset = 0;
  #littleEndian = false;
  #data = new Uint8Array();
  #view = new DataView(this.#data.buffer);

  /**
   * Initiates the reader over an uncompressed NBT Uint8Array. Accepts an endian type to read the data with. If one is not provided, big endian will be used.
  */
  read(data: Uint8Array, { endian = "big" }: ReaderOptions = {}) {
    this.#offset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = new Uint8Array(data);
    this.#view = new DataView(this.#data.buffer);

    const tag = this.#getTagType();
    if (tag !== TAG_COMPOUND){
      throw new TypeError(`Encountered unsupported tag type ${tag}`);
    }

    const name = this.#getString();
    const value = this.#getCompound();

    return new NBTData(value,{ name, endian });
  }

  #getTag(tag: TAG_TYPE): Tag {
    switch (tag){
      case TAG_BYTE: return new Byte(this.#getByte());
      case TAG_SHORT: return new Short(this.#getShort());
      case TAG_INT: return new Int(this.#getInt());
      case TAG_LONG: return this.#getLong();
      case TAG_FLOAT: return new Float(this.#getFloat());
      case TAG_DOUBLE: return this.#getDouble();
      case TAG_BYTE_ARRAY: return this.#getByteArray();
      case TAG_STRING: return this.#getString();
      case TAG_LIST: return this.#getList();
      case TAG_COMPOUND: return this.#getCompound();
      case TAG_INT_ARRAY: return this.#getIntArray();
      case TAG_LONG_ARRAY: return this.#getLongArray();
      default: throw new TypeError(`Encountered unsupported tag ${tag}`);
    }
  }

  #getTagType() {
    return this.#getUByte() as TAG_TYPE;
  }

  #getUByte() {
    const value = this.#view.getUint8(this.#offset);
    this.#offset += 1;
    return value;
  }

  #getByte() {
    const value = this.#view.getInt8(this.#offset);
    this.#offset += 1;
    return value;
  }

  #getUShort() {
    const value = this.#view.getUint16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  #getShort() {
    const value = this.#view.getInt16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  #getUInt() {
    const value = this.#view.getUint32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getInt() {
    const value = this.#view.getInt32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getLong() {
    const value = this.#view.getBigInt64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  #getFloat() {
    const value = this.#view.getFloat32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getDouble() {
    const value = this.#view.getFloat64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  #getByteArray() {
    const byteLength = this.#getUInt();
    const value = new Int8Array(this.#data.slice(this.#offset,this.#offset + byteLength));
    this.#offset += byteLength;
    return value;
  }

  #getString() {
    const length = this.#getUShort();
    const value = this.#data.slice(this.#offset,this.#offset + length);
    this.#offset += length;
    return new TextDecoder().decode(value);
  }

  #getList() {
    const tag = this.#getTagType();
    const length = this.#getUInt();
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
      if (tag === TAG_END) break;
      const name = this.#getString();
      const entry = this.#getTag(tag);
      value[name] = entry;
    }
    return value;
  }

  #getIntArray() {
    const byteLength = this.#getUInt();
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.#getInt();
      value[i] = entry;
    }
    return value;
  }

  #getLongArray() {
    const byteLength = this.#getUInt();
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.#getLong();
      value[i] = entry;
    }
    return value;
  }
}