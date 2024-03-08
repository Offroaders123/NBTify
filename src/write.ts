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
  return writeRoot(data as NBTData<T>, writer);
}

async function writeRoot<T extends RootTagLike = RootTag>(data: NBTData<T>, writer: DataWriter): Promise<Uint8Array> {
  const { data: root, rootName, endian, compression, bedrockLevel } = data;
  const littleEndian: boolean = endian === "little";
  const type = getTagType(root);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
  }

  if (bedrockLevel){
    writer.writeFloat64(0, littleEndian);
  }

  writer.writeUint8(type);
  if (rootName !== null) writeString(writer, rootName, littleEndian);
  writeTag(writer, root as RootTag, littleEndian);

  if (bedrockLevel){
    if (littleEndian !== true){
      throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
    }
    if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)){
      throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
    }
    const version: number = root["StorageVersion"].valueOf();
    const byteLength = writer.byteOffset - 8;
    writer.view.setUint32(0, version, littleEndian);
    writer.view.setUint32(4, byteLength, littleEndian);
  }

  let result = writer.trimmedEnd();

  if (compression !== null){
    result = await compress(result,compression);
  }

  return result;
}

function writeTag(writer: DataWriter, value: Tag, littleEndian: boolean): void {
  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return writeByte(writer, value as ByteTag | BooleanTag);
    case TAG.SHORT: return writeShort(writer, value as ShortTag, littleEndian);
    case TAG.INT: return writeInt(writer, value as IntTag, littleEndian);
    case TAG.LONG: return writeLong(writer, value as LongTag, littleEndian);
    case TAG.FLOAT: return writeFloat(writer, value as FloatTag, littleEndian);
    case TAG.DOUBLE: return writeDouble(writer, value as DoubleTag, littleEndian);
    case TAG.BYTE_ARRAY: return writeByteArray(writer, value as ByteArrayTag, littleEndian);
    case TAG.STRING: return writeString(writer, value as StringTag, littleEndian);
    case TAG.LIST: return writeList(writer, value as ListTag<Tag>, littleEndian);
    case TAG.COMPOUND: return writeCompound(writer, value as CompoundTag, littleEndian);
    case TAG.INT_ARRAY: return writeIntArray(writer, value as IntArrayTag, littleEndian);
    case TAG.LONG_ARRAY: return writeLongArray(writer, value as LongArrayTag, littleEndian);
  }
}

function writeByte(writer: DataWriter, value: ByteTag | BooleanTag): void {
  writer.writeInt8(Number(value.valueOf()));
}

function writeShort(writer: DataWriter, value: ShortTag, littleEndian: boolean): void {
  writer.writeInt16(value.valueOf(), littleEndian);
}

function writeInt(writer: DataWriter, value: IntTag, littleEndian: boolean): void {
  writer.writeInt32(value.valueOf(), littleEndian);
}

function writeLong(writer: DataWriter, value: LongTag, littleEndian: boolean): void {
  writer.writeBigInt64(value, littleEndian);
}

function writeFloat(writer: DataWriter, value: FloatTag, littleEndian: boolean): void {
  writer.writeFloat32(value.valueOf(), littleEndian);
}

function writeDouble(writer: DataWriter, value: DoubleTag, littleEndian: boolean): void {
  writer.writeFloat64(value, littleEndian);
}

function writeByteArray(writer: DataWriter, value: ByteArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt8Array(value);
}

function writeString(writer: DataWriter, value: StringTag, littleEndian: boolean): void {
  writer.writeUint16(Buffer.from(value).byteLength, littleEndian);
  writer.writeString(value);
}

function writeList(writer: DataWriter, value: ListTag<Tag>, littleEndian: boolean): void {
  let type: TAG | undefined = value[TAG_TYPE];
  value = value.filter(isTag);
  type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
  const { length } = value;
  writer.writeUint8(type);
  writer.writeInt32(length, littleEndian);
  for (const entry of value){
    if (getTagType(entry) !== type){
      throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
    }
    writeTag(writer, entry, littleEndian);
  }
}

function writeCompound(writer: DataWriter, value: CompoundTag, littleEndian: boolean): void {
  for (const [name,entry] of Object.entries(value)){
    if (entry === undefined) continue;
    const type = getTagType(entry as unknown);
    if (type === null) continue;
    writer.writeUint8(type);
    writeString(writer, name, littleEndian);
    writeTag(writer, entry, littleEndian);
  }
  writer.writeUint8(TAG.END);
}

function writeIntArray(writer: DataWriter, value: IntArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt32Array(value, littleEndian);
}

function writeLongArray(writer: DataWriter, value: LongArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeBigInt64Array(value, littleEndian);
}

class DataWriter {
  byteOffset: number;
  data: Uint8Array;
  view: DataView;
  encoder: TextEncoder;

  constructor() {
    this.byteOffset = 0;
    this.data = new Uint8Array(1024);
    this.view = new DataView(this.data.buffer);
    this.encoder = new TextEncoder();
  }

  writeUint8(value: number): void {
    this.write("Uint8", value);
  }

  writeInt8(value: number): void {
    this.write("Int8", value);
  }

  writeUint16(value: number, littleEndian: boolean): void {
    this.write("Uint16", value, littleEndian);
  }

  writeInt16(value: number, littleEndian: boolean): void {
    this.write("Int16", value, littleEndian);
  }

  writeUint32(value: number, littleEndian: boolean): void {
    this.write("Uint32", value, littleEndian);
  }

  writeInt32(value: number, littleEndian: boolean): void {
    this.write("Int32", value, littleEndian);
  }

  writeFloat32(value: number, littleEndian: boolean): void {
    this.write("Float32", value, littleEndian);
  }

  writeFloat64(value: number, littleEndian: boolean): void {
    this.write("Float64", value, littleEndian);
  }

  writeBigUint64(value: bigint, littleEndian: boolean): void {
    this.write("BigUint64", value, littleEndian);
  }

  writeBigInt64(value: bigint, littleEndian: boolean): void {
    this.write("BigInt64", value, littleEndian);
  }

  private write<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>): void;
  private write<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>, littleEndian: boolean): void;
  private write(type: keyof typeof ByteType, value: number | bigint, littleEndian?: boolean): void {
    this.allocate(ByteType[type]);
    this.view[`set${type}`]((this.byteOffset += ByteType[type]) - ByteType[type], value as never, littleEndian);
  }

  writeInt8Array(value: Int8Array | Uint8Array): void {
    const { length } = value;
    this.allocate(length);
    this.data.set(value,this.byteOffset);
    this.byteOffset += length;
  }

  writeString(value: StringTag): void {
    const entry = this.encoder.encode(value);
    const { length } = entry;
    this.allocate(length);
    this.data.set(entry,this.byteOffset);
    this.byteOffset += length;
  }

  writeInt32Array(value: Int32Array | Uint32Array, littleEndian: boolean): void {
    for (const entry of value){
      this.writeInt32(entry, littleEndian);
    }
  }

  writeBigInt64Array(value: BigInt64Array | BigUint64Array, littleEndian: boolean): void {
    for (const entry of value){
      this.writeBigInt64(entry, littleEndian);
    }
  }

  trimmedEnd(): Uint8Array {
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