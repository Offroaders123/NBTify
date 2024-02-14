import { NBTData } from "./format.js";
import { TAG, TAG_TYPE, isTag, getTagType } from "./tag.js";
import { Int32 } from "./primitive.js";
import { compress } from "./compression.js";

import type { RootName, Endian, NBTDataOptions } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

/**
 * Converts an NBTData object into an NBT buffer. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If a format option isn't specified, the value of the equivalent property on the NBTData object will be used.
*/
export async function write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options: NBTDataOptions = {}): Promise<Uint8Array> {
  if (data instanceof NBTData){
    if (options.rootName === undefined){
      options.rootName = data.rootName;
    }
    if (options.endian === undefined){
      options.endian = data.endian;
    }
    if (options.compression === undefined){
      options.compression = data.compression;
    }
    if (options.bedrockLevel === undefined){
      options.bedrockLevel = data.bedrockLevel;
    }
    data = data.data;
  }

  const { rootName, endian, compression, bedrockLevel } = options;

  if (typeof data !== "object" || data === null){
    data satisfies never;
    throw new TypeError("First parameter must be an object or array");
  }
  if (rootName !== undefined && typeof rootName !== "string" && rootName !== null){
    rootName satisfies never;
    throw new TypeError("Root Name option must be a string or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    endian satisfies never;
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
    compression satisfies never;
    throw new TypeError("Compression option must be a valid compression type");
  }
  if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean"){
    bedrockLevel satisfies never;
    throw new TypeError("Bedrock Level option must be a boolean");
  }

  let result = new NBTWriter().write(data,{ rootName, endian });

  if (bedrockLevel){
    if (endian !== "little"){
      throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
    }
    if (!("StorageVersion" in data) || !(data.StorageVersion instanceof Int32)){
      throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
    }
    const { byteLength } = result;
    const data1 = new Uint8Array(byteLength + 8);
    const view = new DataView(data1.buffer);
    const version: number = data.StorageVersion.valueOf();
    view.setUint32(0,version,true);
    view.setUint32(4,byteLength,true);
    data1.set(result,8);
    result = data1;
  }

  if (compression !== undefined && compression !== null){
    result = await compress(result,compression);
  }

  return result;
}

export interface NBTWriterOptions {
  rootName?: RootName;
  endian?: Endian;
}

/**
 * The base implementation to convert an NBTData object into an NBT buffer.
*/
export class NBTWriter {
  #rootName!: RootName;
  #byteOffset!: number;
  #littleEndian!: boolean;
  #data!: Uint8Array;
  #view!: DataView;
  #encoder = new TextEncoder();

  /**
   * Initiates the writer over an NBTData object.
  */
  write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options: NBTWriterOptions = {}): Uint8Array {
    if (data instanceof NBTData){
      if (options.rootName === undefined){
        options.rootName = data.rootName;
      }
      if (options.endian === undefined){
        options.endian = data.endian;
      }
      data = data.data;
    }

    const { rootName = "", endian = "big" } = options;

    if (typeof data !== "object" || data === null){
      data satisfies never;
      throw new TypeError("First parameter must be an object or array");
    }
    if (typeof rootName !== "string" && rootName !== null){
      rootName satisfies never;
      throw new TypeError("Root Name option must be a string or null");
    }
    if (endian !== "big" && endian !== "little"){
      endian satisfies never;
      throw new TypeError("Endian option must be a valid endian type");
    }

    this.#rootName = rootName;
    this.#byteOffset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = new Uint8Array(1024);
    this.#view = new DataView(this.#data.buffer);

    this.#writeRoot(data as RootTag);

    this.#allocate(0);
    return this.#data.slice(0,this.#byteOffset);
  }

  #allocate(byteLength: number): void {
    const required = this.#byteOffset + byteLength;
    if (this.#data.byteLength >= required) return;

    let length = this.#data.byteLength;

    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.#data,0);

    if (this.#byteOffset > this.#data.byteLength){
      data.fill(0,byteLength,this.#byteOffset);
    }

    this.#data = data;
    this.#view = new DataView(data.buffer);
  }

  #writeRoot(value: RootTag): void {
    const type = getTagType(value);
    if (type !== TAG.LIST && type !== TAG.COMPOUND){
      throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
    }

    this.#writeTagType(type);
    this.#writeRootName(this.#rootName);

    switch (type){
      case TAG.LIST: return this.#writeList(value as ListTag<Tag>);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
    }
  }

  #writeRootName(value: RootName): void {
    if (value === null) return;
    this.#writeString(value);
  }

  #writeTag(value: Tag): void {
    const type = getTagType(value);
    switch (type){
      case TAG.BYTE: return this.#writeByte(value as ByteTag | BooleanTag);
      case TAG.SHORT: return this.#writeShort(value as ShortTag);
      case TAG.INT: return this.#writeInt(value as IntTag);
      case TAG.LONG: return this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat(value as FloatTag);
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTag<Tag>);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag);
    }
  }

  #writeTagType(type: TAG): void {
    this.#writeUnsignedByte(type);
  }

  #writeUnsignedByte(value: number): void {
    this.#allocate(1);
    this.#view.setUint8(this.#byteOffset,value);
    this.#byteOffset += 1;
  }

  #writeByte(value: number | ByteTag | BooleanTag): void {
    this.#allocate(1);
    this.#view.setInt8(this.#byteOffset,Number(value.valueOf()));
    this.#byteOffset += 1;
  }

  #writeUnsignedShort(value: number): void {
    this.#allocate(2);
    this.#view.setUint16(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 2;
  }

  #writeShort(value: number | ShortTag): void {
    this.#allocate(2);
    this.#view.setInt16(this.#byteOffset,value.valueOf(),this.#littleEndian);
    this.#byteOffset += 2;
  }

  #writeInt(value: number | IntTag): void {
    this.#allocate(4);
    this.#view.setInt32(this.#byteOffset,value.valueOf(),this.#littleEndian);
    this.#byteOffset += 4;
  }

  #writeLong(value: LongTag): void {
    this.#allocate(8);
    this.#view.setBigInt64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #writeFloat(value: number | FloatTag): void {
    this.#allocate(4);
    this.#view.setFloat32(this.#byteOffset,value.valueOf(),this.#littleEndian);
    this.#byteOffset += 4;
  }

  #writeDouble(value: DoubleTag): void {
    this.#allocate(8);
    this.#view.setFloat64(this.#byteOffset,value,this.#littleEndian);
    this.#byteOffset += 8;
  }

  #writeByteArray(value: ByteArrayTag): void {
    const { length } = value;
    this.#writeInt(length);
    this.#allocate(length);
    this.#data.set(value,this.#byteOffset);
    this.#byteOffset += length;
  }

  #writeString(value: StringTag): void {
    const entry = this.#encoder.encode(value);
    const { length } = entry;
    this.#writeUnsignedShort(length);
    this.#allocate(length);
    this.#data.set(entry,this.#byteOffset);
    this.#byteOffset += length;
  }

  #writeList(value: ListTag<Tag>): void {
    let type: TAG | undefined = value[TAG_TYPE];
    value = value.filter(isTag);
    type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
    const { length } = value;
    this.#writeTagType(type);
    this.#writeInt(length);
    for (const entry of value){
      if (getTagType(entry) !== type){
        throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
      }
      this.#writeTag(entry);
    }
  }

  #writeCompound(value: CompoundTag): void {
    for (const [name,entry] of Object.entries(value)){
      if (entry === undefined) continue;
      const type = getTagType(entry as unknown);
      if (type === null) continue;
      this.#writeTagType(type);
      this.#writeString(name);
      this.#writeTag(entry);
    }
    this.#writeTagType(TAG.END);
  }

  #writeIntArray(value: IntArrayTag): void {
    const { length } = value;
    this.#writeInt(length);
    for (const entry of value){
      this.#writeInt(entry);
    }
  }

  #writeLongArray(value: LongArrayTag): void {
    const { length } = value;
    this.#writeInt(length);
    for (const entry of value){
      this.#writeLong(entry);
    }
  }
}