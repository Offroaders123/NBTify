import { NBTData, Endian, Compression, BedrockLevel } from "./index.js";
import { Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getType } from "./tag.js";
import { compress } from "./compression.js";

export interface NBTWriteOptions {
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: BedrockLevel;
}

/**
 * Converts an NBTData object into an NBT Uint8Array. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If an option isn't provided, the value of the equivalent property on the NBTData object will be used.
*/
export async function write(data: NBTData, { endian = data.endian, compression = data.compression, bedrockLevel = data.bedrockLevel }: NBTWriteOptions = {}){
  if (!(data instanceof NBTData)){
    throw new TypeError("First parameter must be an NBTData object");
  }
  if (endian !== "big" && endian !== "little"){
    throw new TypeError("Endian option must be a valid endian type");
  }

  const writer = new NBTWriter();
  let result = writer.write(data,{ endian });

  if (compression === "gzip"){
    result = await compress(result,{ format: "gzip" });
  }

  if (bedrockLevel !== undefined){
    const header = new Uint8Array(8);
    const view = new DataView(header.buffer);
    const version = bedrockLevel.valueOf();
    const { byteLength } = result;
    view.setUint32(0,version,true);
    view.setUint32(4,byteLength,true);
    result = new Uint8Array([...header,...result]);
  }

  return result;
}

export interface NBTWriterOptions {
  endian?: Endian;
}

/**
 * The base implementation to convert an NBTData object into an NBT Uint8Array.
*/
export class NBTWriter {
  #byteOffset = 0;
  #littleEndian = false;
  #buffer = new ArrayBuffer(1024);
  #data = new Uint8Array(this.#buffer);
  #view = new DataView(this.#buffer);

  /**
   * Initiates the writer over an NBTData object. Accepts an endian type to write the data with. If one is not provided, the value of the endian property on the NBTData object will be used.
  */
  write(data: NBTData, { endian = data.endian }: NBTWriterOptions = {}) {
    if (!(data instanceof NBTData)){
      throw new TypeError("First parameter must be an NBTData object");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }

    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#buffer = new ArrayBuffer(1024);
    this.#data = new Uint8Array(this.#buffer);
    this.#view = new DataView(this.#buffer);

    const { name } = data;
    const { data: value } = data;

    try {
      this.#setTagType(TAG.COMPOUND);
      if (name !== null) this.#setString(name);
      this.#setCompound(value);
    } catch (error: any){
      throw new Error(error);
    }

    this.#accommodate(0);
    const result = this.#data.slice(0,this.#byteOffset);
    return new Uint8Array(result);
  }

  #accommodate(size: number) {
    const required = this.#byteOffset + size;
    const { byteLength } = this.#buffer;
    if (byteLength >= required) return;

    let length = byteLength;
    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.#data);

    if (this.#byteOffset > byteLength){
      data.fill(0,byteLength,this.#byteOffset);
    }

    this.#buffer = data.buffer;
    this.#view = new DataView(this.#buffer);
    this.#data = data;
  }

  #setTag(value: Tag) {
    const type = getType(value);
    switch (type){
      case TAG.BYTE: return this.#setByte((value as ByteTag).valueOf());
      case TAG.SHORT: return this.#setShort((value as ShortTag).valueOf());
      case TAG.INT: return this.#setInt((value as IntTag).valueOf());
      case TAG.LONG: return this.#setLong(value as LongTag);
      case TAG.FLOAT: return this.#setFloat((value as FloatTag).valueOf());
      case TAG.DOUBLE: return this.#setDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#setByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#setString(value as StringTag);
      case TAG.LIST: return this.#setList(value as ListTag);
      case TAG.COMPOUND: return this.#setCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#setIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#setLongArray(value as LongArrayTag);
    }
  }

  #setTagType(value: TAG) {
    this.#setUnsignedByte(value);
  }

  #setUnsignedByte(value: number) {
    this.#accommodate(1);
    this.#view.setUint8(this.#byteOffset,value);
    this.#byteOffset += 1;
  }

  #setByte(value: number) {
    this.#accommodate(1);
    this.#view.setInt8(this.#byteOffset,value);
    this.#byteOffset += 1;
  }

  #setUnsignedShort(value: number) {
    this.#accommodate(2);
    this.#view.setUint16(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 2;
  }

  #setShort(value: number) {
    this.#accommodate(2);
    this.#view.setInt16(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 2;
  }

  #setInt(value: number) {
    this.#accommodate(4);
    this.#view.setInt32(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 4;
  }

  #setLong(value: bigint) {
    this.#accommodate(8);
    this.#view.setBigInt64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #setFloat(value: number) {
    this.#accommodate(4);
    this.#view.setFloat32(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 4;
  }

  #setDouble(value: number) {
    this.#accommodate(8);
    this.#view.setFloat64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #setByteArray(value: Int8Array) {
    const { byteLength } = value;
    this.#setInt(byteLength);
    this.#accommodate(byteLength);
    this.#data.set(value,this.#byteOffset);
    this.#byteOffset += byteLength;
  }

  #setString(value: string) {
    const entry = new TextEncoder().encode(value);
    const { length } = entry;
    this.#setUnsignedShort(length);
    this.#accommodate(length);
    this.#data.set(entry,this.#byteOffset);
    this.#byteOffset += length;
  }

  #setList(value: ListTag) {
    const template = value[0] as Tag | undefined;
    const tag = (template !== undefined) ? getType(template): TAG.END;
    const { length } = value;
    this.#setTagType(tag);
    this.#setInt(length);
    for (const entry of value){
      this.#setTag(entry);
    }
  }

  #setCompound(value: CompoundTag) {
    for (const [name,entry] of Object.entries(value)){
      const tag = getType(entry);
      this.#setTagType(tag);
      this.#setString(name);
      this.#setTag(entry);
    }
    this.#setTagType(TAG.END);
  }

  #setIntArray(value: Int32Array) {
    const { byteLength } = value;
    this.#setInt(byteLength);
    for (const entry of value){
      this.#setInt(entry);
    }
  }

  #setLongArray(value: BigInt64Array) {
    const { byteLength } = value;
    this.#setInt(byteLength);
    for (const entry of value){
      this.#setLong(entry);
    }
  }
}