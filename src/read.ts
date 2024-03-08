import { NBTData } from "./format.js";
import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { ByteType } from "./data-backing.js";
import { TAG, TAG_TYPE } from "./tag.js";
import { decompress } from "./compression.js";
import { NBTError } from "./error.js";

import type { RootName, Endian, Compression, BedrockLevel } from "./format.js";
import type { Tag, RootTag, RootTagLike, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface ReadOptions {
  rootName: boolean | RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
  strict: boolean;
}

/**
 * Converts an NBT buffer into an NBT object. Accepts an endian type, compression format, and file headers to read the data with.
 * 
 * If a format option isn't specified, the function will attempt reading the data using all options until it either throws or returns successfully.
*/
export async function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike | Blob, options: Partial<ReadOptions> = {}): Promise<NBTData<T>> {
  if (data instanceof Blob){
    data = await data.arrayBuffer();
  }

  if (!("byteOffset" in data)){
    data = new Uint8Array(data);
  }

  if (!(data instanceof Uint8Array)){
    data satisfies never;
    throw new TypeError("First parameter must be a Uint8Array, ArrayBuffer, SharedArrayBuffer, or Blob");
  }

  const reader = new DataReader(data);
  let { rootName, endian, compression, bedrockLevel, strict = true } = options;

  if (rootName !== undefined && typeof rootName !== "boolean" && typeof rootName !== "string" && rootName !== null){
    rootName satisfies never;
    throw new TypeError("Root Name option must be a boolean, string, or null");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    endian satisfies never;
    throw new TypeError("Endian option must be a valid endian type");
  }
  if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
    compression satisfies never;
    throw new TypeError("Compression option must be a valid compression type");
  }
  if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean" && typeof bedrockLevel !== "number" && bedrockLevel !== null){
    bedrockLevel satisfies never;
    throw new TypeError("Bedrock Level option must be a boolean, number, or null");
  }
  if (typeof strict !== "boolean"){
    strict satisfies never;
    throw new TypeError("Strict option must be a boolean");
  }

  compression: if (compression === undefined){
    switch (true){
      case hasGzipHeader(reader): compression = "gzip"; break compression;
      case hasZlibHeader(reader): compression = "deflate"; break compression;
    }
    try {
      return await read<T>(data,{ ...options, compression: null });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, compression: "deflate-raw" });
      } catch {
        throw error;
      }
    }
  }

  compression satisfies Compression;

  if (endian === undefined){
    try {
      return await read<T>(data,{ ...options, endian: "big" });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, endian: "little" });
      } catch {
        throw error;
      }
    }
  }

  endian satisfies Endian;

  if (rootName === undefined){
    try {
      return await read<T>(data,{ ...options, rootName: true });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, rootName: false });
      } catch {
        throw error;
      }
    }
  }

  rootName satisfies boolean | RootName;

  if (compression !== null){
    data = await decompress(data,compression);
  }

  if (bedrockLevel === undefined){
    bedrockLevel = hasBedrockLevelHeader(reader,endian);
  }

  return readRoot<T>(reader, { rootName, endian, compression, bedrockLevel, strict });
}

function hasGzipHeader(reader: DataReader): boolean {
  const header = reader.view.getUint16(0,false);
  return header === 0x1F8B;
}

function hasZlibHeader(reader: DataReader): boolean {
  const header = reader.view.getUint8(0);
  return header === 0x78;
}

function hasBedrockLevelHeader(reader: DataReader, endian: Endian): boolean {
  if (endian !== "little" || reader.data.byteLength < 8) return false;
  const byteLength = reader.view.getUint32(4,true);
  return byteLength === reader.data.byteLength - 8;
}

async function readRoot<T extends RootTagLike = RootTag>(reader: DataReader, { rootName, endian, compression, bedrockLevel, strict }: ReadOptions): Promise<NBTData<T>> {
  let littleEndian: boolean = endian === "little";

  if (compression !== null){
    reader.data = await decompress(reader.data,compression);
    reader.view = new DataView(reader.data.buffer);
  }

  if (bedrockLevel){
    // const version =
      reader.readUint32(littleEndian);
    reader.readUint32(littleEndian);
  }

  const type = readTagType(reader);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
  }

  const rootNameV: RootName = typeof rootName === "string" || rootName ? readString(reader, littleEndian) : null;
  const root: T = readTag<T>(reader, type, littleEndian);

  if (strict && reader.data.byteLength > reader.byteOffset){
    const remaining = reader.data.byteLength - reader.byteOffset;
    throw new NBTError(`Encountered unexpected End tag at byte offset ${reader.byteOffset}, ${remaining} unread bytes remaining`,{ byteOffset: reader.byteOffset, cause: new NBTData<RootTag>(root as RootTag,{ rootName: rootNameV, endian }), remaining });
  }

  return new NBTData(root, { rootName: rootNameV, endian, compression, bedrockLevel });
}

function readTag<T extends Tag>(reader: DataReader, type: TAG, littleEndian: boolean): T;
function readTag<T extends RootTagLike>(reader: DataReader, type: TAG, littleEndian: boolean): T;
function readTag(reader: DataReader, type: TAG, littleEndian: boolean): Tag {
  switch (type){
    case TAG.END: {
      const remaining = reader.data.byteLength - reader.byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${reader.byteOffset}, ${remaining} unread bytes remaining`);
    }
    case TAG.BYTE: return readByte(reader);
    case TAG.SHORT: return readShort(reader, littleEndian);
    case TAG.INT: return readInt(reader, littleEndian);
    case TAG.LONG: return readLong(reader, littleEndian);
    case TAG.FLOAT: return readFloat(reader, littleEndian);
    case TAG.DOUBLE: return readDouble(reader, littleEndian);
    case TAG.BYTE_ARRAY: return readByteArray(reader, littleEndian);
    case TAG.STRING: return readString(reader, littleEndian);
    case TAG.LIST: return readList(reader, littleEndian);
    case TAG.COMPOUND: return readCompound(reader, littleEndian);
    case TAG.INT_ARRAY: return readIntArray(reader, littleEndian);
    case TAG.LONG_ARRAY: return readLongArray(reader, littleEndian);
    default: throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${reader.byteOffset}`);
  }
}

function readTagType(reader: DataReader): TAG {
  return reader.readUint8() as TAG;
}

function readByte(reader: DataReader): ByteTag {
  return new Int8(reader.readInt8());
}

function readShort(reader: DataReader, littleEndian: boolean): ShortTag {
  return new Int16(reader.readInt16(littleEndian));
}

function readInt(reader: DataReader, littleEndian: boolean): IntTag {
  return new Int32(reader.readInt32(littleEndian));
}

function readLong(reader: DataReader, littleEndian: boolean): LongTag {
  return reader.readBigInt64(littleEndian);
}

function readFloat(reader: DataReader, littleEndian: boolean): FloatTag {
  return new Float32(reader.readFloat32(littleEndian));
}

function readDouble(reader: DataReader, littleEndian: boolean): DoubleTag {
  return reader.readFloat64(littleEndian);
}

function readByteArray(reader: DataReader, littleEndian: boolean): ByteArrayTag {
  return reader.readInt8Array(reader.readInt32(littleEndian));
}

function readString(reader: DataReader, littleEndian: boolean): StringTag {
  const length = reader.readUint16(littleEndian);
  return reader.readString(length);
}

function readList(reader: DataReader, littleEndian: boolean): ListTag<Tag> {
  const type = readTagType(reader);
  const length = reader.readInt32(littleEndian);
  const value: ListTag<Tag> = [];
  Object.defineProperty(value,TAG_TYPE,{
    configurable: true,
    enumerable: false,
    writable: true,
    value: type
  });
  for (let i = 0; i < length; i++){
    const entry = readTag(reader, type, littleEndian);
    value.push(entry);
  }
  return value;
}

function readCompound(reader: DataReader, littleEndian: boolean): CompoundTag {
  const value: CompoundTag = {};
  while (true){
    const type = readTagType(reader);
    if (type === TAG.END) break;
    const nameLength = reader.readUint16(littleEndian);
    const name = reader.readString(nameLength);
    const entry = readTag(reader, type, littleEndian);
    value[name] = entry;
  }
  return value;
}

function readIntArray(reader: DataReader, littleEndian: boolean): IntArrayTag {
  return reader.readInt32Array(reader.readInt32(littleEndian), littleEndian);
}

function readLongArray(reader: DataReader, littleEndian: boolean): LongArrayTag {
  return reader.readBigInt64Array(reader.readInt32(littleEndian), littleEndian);
}

class DataReader {
  byteOffset: number;
  data: Uint8Array;
  view: DataView;
  private decoder: TextDecoder;

  constructor(data: Uint8Array) {
    this.byteOffset = 0;
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.decoder = new TextDecoder();
  }

  readUint8(): number {
    return this.read("Uint8");
  }

  readInt8(): number {
    return this.read("Int8");
  }

  readUint16(littleEndian: boolean): number {
    return this.read("Uint16", littleEndian);
  }

  readInt16(littleEndian: boolean): number {
    return this.read("Int16", littleEndian);
  }

  readUint32(littleEndian: boolean): number {
    return this.read("Uint32", littleEndian);
  }

  readInt32(littleEndian: boolean): number {
    return this.read("Int32", littleEndian);
  }

  readFloat32(littleEndian: boolean): number {
    return this.read("Float32", littleEndian);
  }

  readFloat64(littleEndian: boolean): number {
    return this.read("Float64", littleEndian);
  }

  readBigUint64(littleEndian: boolean): bigint {
    return this.read("BigUint64", littleEndian);
  }

  readBigInt64(littleEndian: boolean): bigint {
    return this.read("BigInt64", littleEndian);
  }

  private read<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T): ReturnType<DataView[`get${T}`]>;
  private read<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, littleEndian: boolean): ReturnType<DataView[`get${T}`]>;
  private read(type: keyof typeof ByteType, littleEndian?: boolean): number | bigint {
    this.allocate(ByteType[type]);
    return this.view[`get${type}`]((this.byteOffset += ByteType[type]) - ByteType[type], littleEndian);
  }

  readInt8Array(length: number): Int8Array {
    this.allocate(length);
    return new Int8Array(this.data.subarray(this.byteOffset, this.byteOffset += length));
  }

  readString(length: number): string {
    this.allocate(length);
    return this.decoder.decode(this.data.subarray(this.byteOffset, this.byteOffset += length));
  }

  readInt32Array(length: number, littleEndian: boolean): Int32Array {
    const value = new Int32Array(length);
    for (const i in value){
      const entry = this.readInt32(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  readBigInt64Array(length: number, littleEndian: boolean): BigInt64Array {
    const value = new BigInt64Array(length);
    for (const i in value){
      const entry = this.readBigInt64(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  private allocate(byteLength: number): void {
    if (this.byteOffset + byteLength > this.data.byteLength){
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }
}