import { Endian, Compression, BedrockLevel, NBTData } from "./index.js";
import { Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getType } from "./tag.js";
import { compress } from "./compression.js";

export interface WriteOptions {
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: BedrockLevel;
}

/**
 * Converts an NBTData object into an NBT Uint8Array. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If an option isn't provided, the value of the equivalent property on the NBTData object will be used.
*/
export async function write(data: NBTData, { endian = data.endian, compression = data.compression, bedrockLevel = data.bedrockLevel }: WriteOptions = {}){
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

export interface WriterOptions {
  endian?: Endian;
}

/**
 * The base implementation to convert an NBTData object into an NBT Uint8Array.
*/
export class NBTWriter {
  #byteOffset!: number;
  #littleEndian!: boolean;
  #view!: DataView;
  #encoder = new TextEncoder();

  /**
   * Initiates the writer over an NBTData object. Accepts an endian type to write the data with. If one is not provided, the value of the endian property on the NBTData object will be used.
  */
  write(data: NBTData, { endian = data.endian }: WriterOptions = {}) {
    if (!(data instanceof NBTData)){
      throw new TypeError("First parameter must be an NBTData object");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }

    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#view = new DataView(new ArrayBuffer(1024));

    const { name } = data;
    const { data: value } = data;

    try {
      this.#writeTagType(TAG.COMPOUND);
      if (name !== null) this.#writeString(name);
      this.#writeCompound(value);
    } catch (error: any){
      throw new Error(error);
    }

    this.#accommodate(0);
    const result = this.#view.buffer.slice(0,this.#byteOffset);
    return new Uint8Array(result);
  }

  #accommodate(size: number) {
    const required = this.#byteOffset + size;
    const { byteLength } = this.#view.buffer;
    if (byteLength >= required) return;

    let length = byteLength;
    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(new Uint8Array(this.#view.buffer));

    if (this.#byteOffset > byteLength){
      data.fill(0,byteLength,this.#byteOffset);
    }

    this.#view = new DataView(data.buffer);
  }

  #writeTag(value: Tag) {
    const type = getType(value);
    switch (type){
      case TAG.BYTE: return this.#writeByte((value as ByteTag).valueOf());
      case TAG.SHORT: return this.#writeShort((value as ShortTag).valueOf());
      case TAG.INT: return this.#writeInt((value as IntTag).valueOf());
      case TAG.LONG: return this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat((value as FloatTag).valueOf());
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTag);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag);
    }
  }

  #writeTagType(type: TAG) {
    this.#writeUnsignedByte(type);
  }

  #writeUnsignedByte(value: number) {
    this.#accommodate(1);
    this.#view.setUint8(this.#byteOffset,value);
    this.#byteOffset += 1;
  }

  #writeByte(value: number) {
    this.#accommodate(1);
    this.#view.setInt8(this.#byteOffset,value);
    this.#byteOffset += 1;
  }

  #writeUnsignedShort(value: number) {
    this.#accommodate(2);
    this.#view.setUint16(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 2;
  }

  #writeShort(value: number) {
    this.#accommodate(2);
    this.#view.setInt16(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 2;
  }

  #writeInt(value: number) {
    this.#accommodate(4);
    this.#view.setInt32(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 4;
  }

  #writeLong(value: bigint) {
    this.#accommodate(8);
    this.#view.setBigInt64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #writeFloat(value: number) {
    this.#accommodate(4);
    this.#view.setFloat32(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 4;
  }

  #writeDouble(value: number) {
    this.#accommodate(8);
    this.#view.setFloat64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #writeByteArray(value: Int8Array) {
    const { byteLength } = value;
    this.#writeInt(byteLength);
    this.#accommodate(byteLength);

    const data = new Uint8Array(this.#view.buffer);
    data.set(value,this.#byteOffset);

    this.#view = new DataView(data.buffer);
    this.#byteOffset += byteLength;
  }

  #writeString(value: string) {
    const entry = this.#encoder.encode(value);
    const { length } = entry;
    this.#writeUnsignedShort(length);
    this.#accommodate(length);

    const data = new Uint8Array(this.#view.buffer);
    data.set(entry,this.#byteOffset);

    this.#view = new DataView(data.buffer);
    this.#byteOffset += length;
  }

  #writeList(value: ListTag) {
    const template = value[0] as Tag | undefined;
    const tag = (template !== undefined) ? getType(template): TAG.END;
    const { length } = value;
    this.#writeTagType(tag);
    this.#writeInt(length);
    for (const entry of value){
      this.#writeTag(entry);
    }
  }

  #writeCompound(value: CompoundTag) {
    for (const [name,entry] of Object.entries(value)){
      const tag = getType(entry);
      this.#writeTagType(tag);
      this.#writeString(name);
      this.#writeTag(entry);
    }
    this.#writeTagType(TAG.END);
  }

  #writeIntArray(value: Int32Array) {
    const { byteLength } = value;
    this.#writeInt(byteLength);
    for (const entry of value){
      this.#writeInt(entry);
    }
  }

  #writeLongArray(value: BigInt64Array) {
    const { byteLength } = value;
    this.#writeInt(byteLength);
    for (const entry of value){
      this.#writeLong(entry);
    }
  }
}