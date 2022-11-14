import { Metadata, NBTData } from "./index.js";
import { Byte, Short, Int, Float } from "./primitive.js";
import { Tag, ListTag, CompoundTag, TagByte, TAG_BYTE } from "./tags.js";
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

    const tag = this.#getTagByte();
    if (tag !== TAG_BYTE.Compound){
      throw new TypeError(`Encountered unsupported tag type ${tag}`);
    }

    const name = this.#getString();
    const value = this.#getCompound();

    return new NBTData(value,{ name, endian });
  }

  #getTag(tag: TagByte): Tag {
    switch (tag){
      case TAG_BYTE.Byte: return new Byte(this.#getInt8());
      case TAG_BYTE.Short: return new Short(this.#getInt16());
      case TAG_BYTE.Int: return new Int(this.#getInt32());
      case TAG_BYTE.Long: return this.#getBigInt64();
      case TAG_BYTE.Float: return new Float(this.#getFloat32());
      case TAG_BYTE.Double: return this.#getFloat64();
      case TAG_BYTE.ByteArray: return this.#getUint8Array();
      case TAG_BYTE.String: return this.#getString();
      case TAG_BYTE.List: return this.#getList();
      case TAG_BYTE.Compound: return this.#getCompound();
      case TAG_BYTE.IntArray: return this.#getInt32Array();
      case TAG_BYTE.LongArray: return this.#getBigInt64Array();
      default: throw new TypeError(`Encountered unsupported tag ${tag}`);
    }
  }

  #getTagByte() {
    return this.#getUint8() as TagByte;
  }

  #getUint8() {
    const value = this.#view.getUint8(this.#offset);
    this.#offset += 1;
    return value;
  }

  #getInt8() {
    const value = this.#view.getInt8(this.#offset);
    this.#offset += 1;
    return value;
  }

  #getUint16() {
    const value = this.#view.getUint16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  #getInt16() {
    const value = this.#view.getInt16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  #getUint32() {
    const value = this.#view.getUint32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getInt32() {
    const value = this.#view.getInt32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getFloat32() {
    const value = this.#view.getFloat32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  #getFloat64() {
    const value = this.#view.getFloat64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  #getBigInt64() {
    const value = this.#view.getBigInt64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  #getUint8Array() {
    const byteLength = this.#getUint32();
    const value = this.#data.slice(this.#offset,this.#offset + byteLength);
    this.#offset += byteLength;
    return value;
  }

  #getInt32Array() {
    const byteLength = this.#getUint32();
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.#getInt32();
      value[i] = entry;
    }
    return value;
  }

  #getBigInt64Array() {
    const byteLength = this.#getUint32();
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.#getBigInt64();
      value[i] = entry;
    }
    return value;
  }

  #getString() {
    const length = this.#getUint16();
    const value = this.#data.slice(this.#offset,this.#offset + length);
    this.#offset += length;
    return new TextDecoder().decode(value);
  }

  #getList() {
    const tag = this.#getTagByte();
    const length = this.#getUint32();
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
      const tag = this.#getTagByte();
      if (tag === TAG_BYTE.End) break;
      const name = this.#getString();
      const entry = this.#getTag(tag);
      value[name] = entry;
    }
    return value;
  }
}