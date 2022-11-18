import { Metadata, NBTData } from "./index.js";
import { Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG_TYPE, TAG_END, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY, getTagType } from "./tag.js";
import { compress } from "./compression.js";

export interface NBTWriteOptions extends Partial<Pick<Metadata,"endian" | "compression" | "bedrockLevel">> {}

/**
 * Converts an NBTData object into an NBT Uint8Array. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If an option isn't provided, the value of the equivalent property on the NBTData object will be used.
*/
export async function write(data: NBTData, { endian = data.endian, compression = data.compression, bedrockLevel = data.bedrockLevel }: NBTWriteOptions = {}){
  if (!(data instanceof NBTData)){
    throw new TypeError("First argument must be an NBTData object");
  }
  if (endian !== "big" && endian !== "little"){
    throw new TypeError(`Endian option must be set to either "big" or "little"`);
  }

  const writer = new NBTWriter();
  let result = writer.write(data,{ endian });

  if (compression === "gzip"){
    result = await compress(result,{ format: "gzip" });
  }

  if (bedrockLevel !== false){
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

export interface NBTWriterOptions extends Partial<Pick<Metadata,"endian">> {}

/**
 * The base implementation to convert an NBTData object into an NBT Uint8Array.
*/
export class NBTWriter {
  #offset = 0;
  #littleEndian = false;
  #buffer = new ArrayBuffer(1024);
  #data = new Uint8Array(this.#buffer);
  #view = new DataView(this.#buffer);

  /**
   * Initiates the writer over an NBTData object. Accepts an endian type to write the data with. If one is not provided, the value of the endian property on the NBTData object will be used.
  */
  write(data: NBTData, { endian = data.endian }: NBTWriterOptions = {}) {
    if (!(data instanceof NBTData)){
      throw new TypeError("First argument must be an NBTData object");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError(`Endian option must be set to either "big" or "little"`);
    }

    this.#offset = 0;
    this.#littleEndian = (endian === "little");
    this.#buffer = new ArrayBuffer(1024);
    this.#data = new Uint8Array(this.#buffer);
    this.#view = new DataView(this.#buffer);

    const { name } = data;
    const { data: value } = data;

    this.#setTagType(TAG_COMPOUND);
    this.#setString(name);
    this.#setCompound(value);

    this.#accommodate(0);
    const result = this.#data.slice(0,this.#offset);
    return new Uint8Array(result);
  }

  #accommodate(size: number) {
    const required = this.#offset + size;
    const { byteLength } = this.#buffer;
    if (byteLength >= required) return;

    let length = byteLength;
    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.#data);

    if (this.#offset > byteLength){
      data.fill(0,byteLength,this.#offset);
    }

    this.#buffer = data.buffer;
    this.#view = new DataView(this.#buffer);
    this.#data = data;
  }

  #setTag(value: Tag) {
    const type = getTagType(value);
    switch (type){
      case TAG_BYTE: return this.#setByte((value as ByteTag).valueOf());
      case TAG_SHORT: return this.#setShort((value as ShortTag).valueOf());
      case TAG_INT: return this.#setInt((value as IntTag).valueOf());
      case TAG_LONG: return this.#setLong(value as LongTag);
      case TAG_FLOAT: return this.#setFloat((value as FloatTag).valueOf());
      case TAG_DOUBLE: return this.#setDouble(value as DoubleTag);
      case TAG_BYTE_ARRAY: return this.#setByteArray(value as ByteArrayTag);
      case TAG_STRING: return this.#setString(value as StringTag);
      case TAG_LIST: return this.#setList(value as ListTag);
      case TAG_COMPOUND: return this.#setCompound(value as CompoundTag);
      case TAG_INT_ARRAY: return this.#setIntArray(value as IntArrayTag);
      case TAG_LONG_ARRAY: return this.#setLongArray(value as LongArrayTag);
    }
  }

  #setTagType(value: TAG_TYPE) {
    this.#accommodate(1);
    this.#view.setUint8(this.#offset,value);
    this.#offset += 1;
  }

  #setByte(value: number) {
    this.#accommodate(1);
    this.#view.setInt8(this.#offset,value);
    this.#offset += 1;
  }

  #setStringLength(value: number) {
    this.#accommodate(2);
    this.#view.setUint16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  #setShort(value: number) {
    this.#accommodate(2);
    this.#view.setInt16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  #setArrayLength(value: number) {
    this.#accommodate(4);
    this.#view.setUint32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  #setInt(value: number) {
    this.#accommodate(4);
    this.#view.setInt32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  #setLong(value: bigint) {
    this.#accommodate(8);
    this.#view.setBigInt64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  #setFloat(value: number) {
    this.#accommodate(4);
    this.#view.setFloat32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  #setDouble(value: number) {
    this.#accommodate(8);
    this.#view.setFloat64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  #setByteArray(value: Int8Array) {
    const { byteLength } = value;
    this.#setArrayLength(byteLength);
    this.#accommodate(byteLength);
    this.#data.set(value,this.#offset);
    this.#offset += byteLength;
  }

  #setString(value: string) {
    const entry = new TextEncoder().encode(value);
    const { length } = entry;
    this.#setStringLength(length);
    this.#accommodate(length);
    this.#data.set(entry,this.#offset);
    this.#offset += length;
  }

  #setList(value: ListTag) {
    const tag = getTagType(value[0]);
    const { length } = value;
    this.#setTagType(tag);
    this.#setArrayLength(length);
    for (const entry of value){
      this.#setTag(entry);
    }
  }

  #setCompound(value: CompoundTag) {
    for (const [name,entry] of Object.entries(value)){
      const tag = getTagType(entry);
      this.#setTagType(tag);
      this.#setString(name);
      this.#setTag(entry);
    }
    this.#setTagType(TAG_END);
  }

  #setIntArray(value: Int32Array) {
    const { byteLength } = value;
    this.#setArrayLength(byteLength);
    for (const entry of value){
      this.#setInt(entry);
    }
  }

  #setLongArray(value: BigInt64Array) {
    const { byteLength } = value;
    this.#setArrayLength(byteLength);
    for (const entry of value){
      this.#setLong(entry);
    }
  }
}