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

  const reader = new NBTReader(data);
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
      case reader.hasGzipHeader(): compression = "gzip"; break compression;
      case reader.hasZlibHeader(): compression = "deflate"; break compression;
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
    bedrockLevel = reader.hasBedrockLevelHeader(endian);
  }

  return reader.readRoot<T>({ rootName, endian, compression, bedrockLevel, strict });
}

class NBTReader {
  #byteOffset: number = 0;
  #data: Uint8Array;
  #view: DataView;
  #decoder: TextDecoder = new TextDecoder();

  constructor(data: Uint8Array) {
    this.#data = data;
    this.#view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  hasGzipHeader(): boolean {
    const header = this.#view.getUint16(0,false);
    return header === 0x1F8B;
  }

  hasZlibHeader(): boolean {
    const header = this.#view.getUint8(0);
    return header === 0x78;
  }

  hasBedrockLevelHeader(endian: Endian): boolean {
    if (endian !== "little" || this.#data.byteLength < 8) return false;
    const byteLength = this.#view.getUint32(4,true);
    return byteLength === this.#data.byteLength - 8;
  }

  #allocate(byteLength: number): void {
    if (this.#byteOffset + byteLength > this.#data.byteLength){
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }

  async readRoot<T extends RootTagLike = RootTag>({ rootName, endian, compression, bedrockLevel, strict }: ReadOptions): Promise<NBTData<T>> {
    let littleEndian: boolean = endian === "little";

    if (compression !== null){
      this.#data = await decompress(this.#data,compression);
      this.#view = new DataView(this.#data.buffer);
    }

    if (bedrockLevel){
      // const version =
        this.#readUint32(littleEndian);
      this.#readUint32(littleEndian);
    }

    const type = this.#readTagType();
    if (type !== TAG.LIST && type !== TAG.COMPOUND){
      throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
    }

    const rootNameV: RootName = typeof rootName === "string" || rootName ? this.#readStringTaeg(littleEndian) : null;
    const root: T = this.#readTag<T>(type, littleEndian);

    if (strict && this.#data.byteLength > this.#byteOffset){
      const remaining = this.#data.byteLength - this.#byteOffset;
      throw new NBTError(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`,{ byteOffset: this.#byteOffset, cause: new NBTData<RootTag>(root as RootTag,{ rootName: rootNameV, endian }), remaining });
    }

    return new NBTData(root, { rootName: rootNameV, endian, compression, bedrockLevel });
  }

  #readTag<T extends Tag>(type: TAG, littleEndian: boolean): T;
  #readTag<T extends RootTagLike>(type: TAG, littleEndian: boolean): T;
  #readTag(type: TAG, littleEndian: boolean): Tag {
    switch (type){
      case TAG.END: {
        const remaining = this.#data.byteLength - this.#byteOffset;
        throw new Error(`Encountered unexpected End tag at byte offset ${this.#byteOffset}, ${remaining} unread bytes remaining`);
      }
      case TAG.BYTE: return this.#readByte();
      case TAG.SHORT: return this.#readShort(littleEndian);
      case TAG.INT: return this.#readInt(littleEndian);
      case TAG.LONG: return this.#readLong(littleEndian);
      case TAG.FLOAT: return this.#readFloat(littleEndian);
      case TAG.DOUBLE: return this.#readDouble(littleEndian);
      case TAG.BYTE_ARRAY: return this.#readByteArray(littleEndian);
      case TAG.STRING: return this.#readStringTaeg(littleEndian);
      case TAG.LIST: return this.#readList(littleEndian);
      case TAG.COMPOUND: return this.#readCompound(littleEndian);
      case TAG.INT_ARRAY: return this.#readIntArray(littleEndian);
      case TAG.LONG_ARRAY: return this.#readLongArray(littleEndian);
      default: throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${this.#byteOffset}`);
    }
  }

  #readUint8(): number {
    return this.#read("Uint8");
  }

  #readInt8(): number {
    return this.#read("Int8");
  }

  #readTagType(): TAG {
    return this.#readUint8() as TAG;
  }

  #readByte(): ByteTag {
    return new Int8(this.#readInt8());
  }

  #readUint16(littleEndian: boolean): number {
    return this.#read("Uint16", littleEndian);
  }

  #readInt16(littleEndian: boolean): number {
    return this.#read("Int16", littleEndian);
  }

  #readShort(littleEndian: boolean): ShortTag {
    return new Int16(this.#readInt16(littleEndian));
  }

  #readUint32(littleEndian: boolean): number {
    return this.#read("Uint32", littleEndian);
  }

  #readInt32(littleEndian: boolean): number {
    return this.#read("Int32", littleEndian);
  }

  #readInt(littleEndian: boolean): IntTag {
    return new Int32(this.#readInt32(littleEndian));
  }

  #readFloat32(littleEndian: boolean): number {
    return this.#read("Float32", littleEndian);
  }

  #readFloat(littleEndian: boolean): FloatTag {
    return new Float32(this.#readFloat32(littleEndian));
  }

  #readFloat64(littleEndian: boolean): number {
    return this.#read("Float64", littleEndian);
  }

  #readDouble(littleEndian: boolean): DoubleTag {
    return this.#readFloat64(littleEndian);
  }

  #readBigInt64(littleEndian: boolean): bigint {
    return this.#read("BigInt64", littleEndian);
  }

  #readLong(littleEndian: boolean): LongTag {
    return this.#readBigInt64(littleEndian);
  }

  #read<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T): ReturnType<DataView[`get${T}`]>;
  #read<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, littleEndian: boolean): ReturnType<DataView[`get${T}`]>;
  #read(type: keyof typeof ByteType, littleEndian?: boolean): number | bigint {
    this.#allocate(ByteType[type]);
    return this.#view[`get${type}`]((this.#byteOffset += ByteType[type]) - ByteType[type], littleEndian);
  }

  #readInt8Array(length: number): Int8Array {
    this.#allocate(length);
    return new Int8Array(this.#data.subarray(this.#byteOffset, this.#byteOffset += length));
  }

  #readByteArray(littleEndian: boolean): ByteArrayTag {
    return this.#readInt8Array(this.#readInt32(littleEndian));
  }

  #readString(length: number): string {
    this.#allocate(length);
    return this.#decoder.decode(this.#data.subarray(this.#byteOffset, this.#byteOffset += length));
  }

  #readStringTaeg(littleEndian: boolean): StringTag {
    const length = this.#readUint16(littleEndian);
    return this.#readString(length);
  }

  #readList(littleEndian: boolean): ListTag<Tag> {
    const type = this.#readTagType();
    const length = this.#readInt32(littleEndian);
    const value: ListTag<Tag> = [];
    Object.defineProperty(value,TAG_TYPE,{
      configurable: true,
      enumerable: false,
      writable: true,
      value: type
    });
    for (let i = 0; i < length; i++){
      const entry = this.#readTag(type, littleEndian);
      value.push(entry);
    }
    return value;
  }

  #readCompound(littleEndian: boolean): CompoundTag {
    const value: CompoundTag = {};
    while (true){
      const type = this.#readTagType();
      if (type === TAG.END) break;
      const nameLength = this.#readUint16(littleEndian);
      const name = this.#readString(nameLength);
      const entry = this.#readTag(type, littleEndian);
      value[name] = entry;
    }
    return value;
  }

  #readInt32Array(length: number, littleEndian: boolean): Int32Array {
    const value = new Int32Array(length);
    for (const i in value){
      const entry = this.#readInt32(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  #readIntArray(littleEndian: boolean): IntArrayTag {
    return this.#readInt32Array(this.#readInt32(littleEndian), littleEndian);
  }

  #readBigInt64Array(length: number, littleEndian: boolean): BigInt64Array {
    const value = new BigInt64Array(length);
    for (const i in value){
      const entry = this.#readBigInt64(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  #readLongArray(littleEndian: boolean): LongArrayTag {
    return this.#readBigInt64Array(this.#readInt32(littleEndian), littleEndian);
  }
}