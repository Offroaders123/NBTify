import { NBTData } from "./format.js";
import { TAG, TAG_TYPE, isTag, getTagType } from "./tag.js";
import { Int32 } from "./primitive.js";
import { ByteType } from "./data-backing.js";
import { compress } from "./compression.js";

import type { NBTDataOptions } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

/**
 * Converts an NBT object into an NBT buffer. Accepts an endian type, compression format, and file headers to write the data with.
 * 
 * If a format option isn't specified, the value of the equivalent property on the NBTData object will be used.
*/
export async function write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options: NBTDataOptions = {}): Promise<Uint8Array> {
  data = new NBTData(data, options);

  const { rootName, endian, compression, bedrockLevel } = data as NBTData<T>;

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

  const writer = new DataWriter();
  return writer.writeRoot(data as NBTData<T>);
}

class DataWriter {
async writeRoot<T extends RootTagLike = RootTag>(data: NBTData<T>): Promise<Uint8Array> {
  const { data: root, rootName, endian, compression, bedrockLevel } = data;
  const littleEndian: boolean = endian === "little";
  const type = getTagType(root);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
  }

  if (bedrockLevel){
    this.writeFloat64(0, littleEndian);
  }

  this.writeUint8(type);
  if (rootName !== null) this.writeStringTaeg(rootName, littleEndian);
  this.writeTag(root as RootTag, littleEndian);

  if (bedrockLevel){
    if (littleEndian !== true){
      throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
    }
    if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)){
      throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
    }
    const version: number = root["StorageVersion"].valueOf();
    const byteLength = this.byteOffset - 8;
    this.view.setUint32(0, version, littleEndian);
    this.view.setUint32(4, byteLength, littleEndian);
  }

  let result = this.trimmedEnd();

  if (compression !== null){
    result = await compress(result,compression);
  }

  return result;
}

private writeTag(value: Tag, littleEndian: boolean): DataWriter {
  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return this.writeByte(value as ByteTag | BooleanTag);
    case TAG.SHORT: return this.writeShort(value as ShortTag, littleEndian);
    case TAG.INT: return this.writeInt(value as IntTag, littleEndian);
    case TAG.LONG: return this.writeLong(value as LongTag, littleEndian);
    case TAG.FLOAT: return this.writeFloat(value as FloatTag, littleEndian);
    case TAG.DOUBLE: return this.writeDouble(value as DoubleTag, littleEndian);
    case TAG.BYTE_ARRAY: return this.writeByteArray(value as ByteArrayTag, littleEndian);
    case TAG.STRING: return this.writeStringTaeg(value as StringTag, littleEndian);
    case TAG.LIST: return this.writeList(value as ListTag<Tag>, littleEndian);
    case TAG.COMPOUND: return this.writeCompound(value as CompoundTag, littleEndian);
    case TAG.INT_ARRAY: return this.writeIntArray(value as IntArrayTag, littleEndian);
    case TAG.LONG_ARRAY: return this.writeLongArray(value as LongArrayTag, littleEndian);
    default: throw new Error(`Encountered unsupported tag type '${type}'`);
  }
}

private writeByte(value: ByteTag | BooleanTag): DataWriter {
  return this.writeInt8(Number(value.valueOf()));
}

private writeShort(value: ShortTag, littleEndian: boolean): DataWriter {
  return this.writeInt16(value.valueOf(), littleEndian);
}

private writeInt(value: IntTag, littleEndian: boolean): DataWriter {
  return this.writeInt32(value.valueOf(), littleEndian);
}

private writeLong(value: LongTag, littleEndian: boolean): DataWriter {
  return this.writeBigInt64(value, littleEndian);
}

private writeFloat(value: FloatTag, littleEndian: boolean): DataWriter {
  return this.writeFloat32(value.valueOf(), littleEndian);
}

private writeDouble(value: DoubleTag, littleEndian: boolean): DataWriter {
  return this.writeFloat64(value, littleEndian);
}

private writeByteArray(value: ByteArrayTag, littleEndian: boolean): DataWriter {
  const { length } = value;
  this.writeInt32(length, littleEndian);
  return this.writeInt8Array(value);
}

private writeStringTaeg(value: StringTag, littleEndian: boolean): DataWriter {
  this.writeUint16(Buffer.from(value).byteLength, littleEndian);
  return this.writeString(value);
}

private writeList(value: ListTag<Tag>, littleEndian: boolean): DataWriter {
  let type: TAG | undefined = value[TAG_TYPE];
  value = value.filter(isTag);
  type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
  const { length } = value;
  this.writeUint8(type);
  this.writeInt32(length, littleEndian);
  for (const entry of value){
    if (getTagType(entry) !== type){
      throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
    }
    this.writeTag(entry, littleEndian);
  }
  return this;
}

private writeCompound(value: CompoundTag, littleEndian: boolean): DataWriter {
  for (const [name,entry] of Object.entries(value)){
    if (entry === undefined) continue;
    const type = getTagType(entry as unknown);
    if (type === null) continue;
    this.writeUint8(type);
    this.writeStringTaeg(name, littleEndian);
    this.writeTag(entry, littleEndian);
  }
  return this.writeUint8(TAG.END);
}

private writeIntArray(value: IntArrayTag, littleEndian: boolean): DataWriter {
  const { length } = value;
  this.writeInt32(length, littleEndian);
  return this.writeInt32Array(value, littleEndian);
}

private writeLongArray(value: LongArrayTag, littleEndian: boolean): DataWriter {
  const { length } = value;
  this.writeInt32(length, littleEndian);
  return this.writeBigInt64Array(value, littleEndian);
}

  private byteOffset: number;
  private data: Uint8Array;
  private view: DataView;
  private encoder: TextEncoder;

  constructor() {
    this.byteOffset = 0;
    this.data = new Uint8Array(1024);
    this.view = new DataView(this.data.buffer);
    this.encoder = new TextEncoder();
  }

  private writeUint8(value: number): this {
    return this.write("Uint8", value);
  }

  private writeInt8(value: number): this {
    return this.write("Int8", value);
  }

  private writeUint16(value: number, littleEndian: boolean): this {
    return this.write("Uint16", value, littleEndian);
  }

  private writeInt16(value: number, littleEndian: boolean): this {
    return this.write("Int16", value, littleEndian);
  }

  private writeUint32(value: number, littleEndian: boolean): this {
    return this.write("Uint32", value, littleEndian);
  }

  private writeInt32(value: number, littleEndian: boolean): this {
    return this.write("Int32", value, littleEndian);
  }

  private writeFloat32(value: number, littleEndian: boolean): this {
    return this.write("Float32", value, littleEndian);
  }

  private writeFloat64(value: number, littleEndian: boolean): this {
    return this.write("Float64", value, littleEndian);
  }

  private writeBigUint64(value: bigint, littleEndian: boolean): this {
    return this.write("BigUint64", value, littleEndian);
  }

  private writeBigInt64(value: bigint, littleEndian: boolean): this {
    return this.write("BigInt64", value, littleEndian);
  }

  private write<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>): this;
  private write<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>, littleEndian: boolean): this;
  private write(type: keyof typeof ByteType, value: number | bigint, littleEndian?: boolean): this {
    this.allocate(ByteType[type]);
    this.view[`set${type}`]((this.byteOffset += ByteType[type]) - ByteType[type], value as never, littleEndian);
    return this;
  }

  private writeInt8Array(value: Int8Array | Uint8Array): this {
    const { length } = value;
    this.allocate(length);
    this.data.set(value,this.byteOffset);
    this.byteOffset += length;
    return this;
  }

  private writeString(value: StringTag): this {
    const entry = this.encoder.encode(value);
    const { length } = entry;
    this.allocate(length);
    this.data.set(entry,this.byteOffset);
    this.byteOffset += length;
    return this;
  }

  private writeInt32Array(value: Int32Array | Uint32Array, littleEndian: boolean): this {
    for (const entry of value){
      this.writeInt32(entry, littleEndian);
    }
    return this;
  }

  private writeBigInt64Array(value: BigInt64Array | BigUint64Array, littleEndian: boolean): this {
    for (const entry of value){
      this.writeBigInt64(entry, littleEndian);
    }
    return this;
  }

  private trimmedEnd(): Uint8Array {
    this.allocate(0);
    return this.data.slice(0,this.byteOffset);
  }

  private allocate(byteLength: number): void {
    const required = this.byteOffset + byteLength;
    if (this.data.byteLength >= required) return;

    let length = this.data.byteLength;

    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.data, 0);

    // not sure this is really needed, keeping it just in case; freezer burn
    if (this.byteOffset > this.data.byteLength){
      data.fill(0, byteLength, this.byteOffset);
    }

    this.data = data;
    this.view = new DataView(data.buffer);
  }
}