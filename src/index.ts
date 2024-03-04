// elxport * from "./read.js";
// elxport * from "./write.js";
// elxport * from "./parse.js";
// elxport * from "./stringify.js";
// elxport * from "./format.js";
// elxport * from "./tag.js";
// elxport * from "./primitive.js";
// elxport * from "./error.js";
// elxport * from "./compression.js";

import { readFile } from "node:fs/promises";

(async () => {

const fileDemo = await readFile(process.argv[2]!);
console.log(fileDemo);

console.log(read(fileDemo));

})();

// read

function read(data: Uint8Array, littleEndian: boolean = false) {
  const reader = new DataReader(data);
  return readRoot(reader, littleEndian);
}

function readRoot(reader: DataReader, littleEndian: boolean): [string, RootTag] {
  const type = reader.readUint8();
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
  }

  const rootName = readString(reader, littleEndian);
  const root: RootTag = readTag(reader, type, littleEndian) as RootTag; // maybe make this generic as well?

  return [rootName, root];
}

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
  const type = reader.readUint8();
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
    const type = reader.readUint8();
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

type ReaderMethod = {
  [K in keyof DataView]: K extends `get${infer T}` ? T : never;
}[keyof DataView];

class DataReader {
  byteOffset: number;
  data: Uint8Array;
  private view: DataView;
  private decoder: TextDecoder;

  constructor(data: Uint8Array) {
    this.byteOffset = 0;
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.decoder = new TextDecoder();
  }

  readUint8(): number {
    return this.read("Uint8", 1, false);
  }

  readInt8(): number {
    return this.read("Int8", 1, false);
  }

  readUint16(littleEndian: boolean): number {
    return this.read("Uint16", 2, littleEndian);
  }

  readInt16(littleEndian: boolean): number {
    return this.read("Int16", 2, littleEndian);
  }

  readUint32(littleEndian: boolean): number {
    return this.read("Uint32", 4, littleEndian);
  }

  readInt32(littleEndian: boolean): number {
    return this.read("Int32", 4, littleEndian);
  }

  readFloat32(littleEndian: boolean): number {
    return this.read("Float32", 4, littleEndian);
  }

  readFloat64(littleEndian: boolean): number {
    return this.read("Float64", 8, littleEndian);
  }

  readBigUint64(littleEndian: boolean): bigint {
    return this.read("BigUint64", 8, littleEndian);
  }

  readBigInt64(littleEndian: boolean): bigint {
    return this.read("BigInt64", 8, littleEndian);
  }

  private read<T extends ReaderMethod>(type: T, byteLength: number, littleEndian: boolean): ReturnType<DataView[`get${T}`]>;
  private read(type: ReaderMethod, byteLength: number, littleEndian: boolean): number | bigint {
    this.allocate(byteLength);
    return this.view[`get${type}`]((this.byteOffset += byteLength) - byteLength, littleEndian);
  }

  readInt8Array(length: number): Int8Array {
    this.allocate(length);
    return new Int8Array(this.data.subarray(this.byteOffset,this.byteOffset += length));
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

// write

type WriterMethod = {
  [K in keyof DataView]: K extends `set${infer T}` ? T : never;
}[keyof DataView];

class DataWriter {
  byteOffset: number;
  data: Uint8Array;
  view: DataView;

  constructor() {
    this.byteOffset = 0;
    this.data = new Uint8Array(1024);
    this.view = new DataView(this.data.buffer);
  }

  writeUint8(value: number): void {
    this.write("Uint8", 1, false, value);
  }

  writeInt8(value: number): void {
    this.write("Int8", 1, false, value);
  }

  writeUint16(value: number, littleEndian: boolean): void {
    this.write("Uint16", 2, littleEndian, value);
  }

  writeInt16(value: number, littleEndian: boolean): void {
    this.write("Int16", 2, littleEndian, value);
  }

  writeUint32(value: number, littleEndian: boolean): void {
    this.write("Uint32", 4, littleEndian, value);
  }

  writeInt32(value: number, littleEndian: boolean): void {
    this.write("Int32", 4, littleEndian, value);
  }

  writeFloat32(value: number, littleEndian: boolean): void {
    this.write("Float32", 4, littleEndian, value);
  }

  writeFloat64(value: number, littleEndian: boolean): void {
    this.write("Int16", 8, littleEndian, value);
  }

  writeBigUint64(value: bigint, littleEndian: boolean): void {
    this.write("BigUint64", 8, littleEndian, value);
  }

  writeBigInt64(value: bigint, littleEndian: boolean): void {
    this.write("BigInt64", 8, littleEndian, value);
  }

  private write<T extends WriterMethod>(type: T, byteLength: number, littleEndian: boolean, value: ReturnType<DataView[`get${T}`]>): void;
  private write(type: WriterMethod, byteLength: number, littleEndian: boolean, value: number | bigint): void {
    this.allocate(byteLength);
    this.view[`set${type}`](byteLength, value as never, littleEndian);
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
    if (this.byteOffset > this.data.byteOffset){
      data.fill(0, byteLength, this.byteOffset);
    }

    this.data = data;
    this.view = new DataView(data.buffer);
  }
}

// tag

type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

type RootTag = CompoundTag | ListTag<Tag>;

type RootTagLike = CompoundTagLike | ListTagLike;

type ByteTag<T extends number = number> = Int8<T>;

type BooleanTag = FalseTag | TrueTag;

type FalseTag = false | ByteTag<0>;

type TrueTag = true | ByteTag<1>;

type ShortTag<T extends number = number> = Int16<T>;

type IntTag<T extends number = number> = Int32<T>;

type LongTag = bigint;

type FloatTag<T extends number = number> = Float32<T>;

type DoubleTag = number;

type ByteArrayTag = Int8Array;

type StringTag = string;

interface ListTag<T extends Tag | undefined> extends Array<T> {
  [TAG_TYPE]?: TAG;
}

type ListTagLike = any[];

interface CompoundTag {
  [name: string]: Tag | undefined;
}

type CompoundTagLike = object;

type IntArrayTag = Int32Array;

type LongArrayTag = BigInt64Array;

enum TAG {
  END = 0,
  BYTE,
  SHORT,
  INT,
  LONG,
  FLOAT,
  DOUBLE,
  BYTE_ARRAY,
  STRING,
  LIST,
  COMPOUND,
  INT_ARRAY,
  LONG_ARRAY
}

Object.freeze(TAG);

const TAG_TYPE = Symbol("nbtify.tag.type");

function isTag<T extends Tag>(value: any): value is T {
  return getTagType(value) !== null;
}

function getTagType(value: Tag): TAG;
function getTagType(value: any): TAG | null;
function getTagType(value: any): TAG | null {
  switch (true){
    case value instanceof Int8:
    case typeof value === "boolean": return TAG.BYTE;
    case value instanceof Int16: return TAG.SHORT;
    case value instanceof Int32: return TAG.INT;
    case typeof value === "bigint": return TAG.LONG;
    case value instanceof Float32: return TAG.FLOAT;
    case typeof value === "number": return TAG.DOUBLE;
    case value instanceof Int8Array: return TAG.BYTE_ARRAY;
    case typeof value === "string": return TAG.STRING;
    case value instanceof Array: return TAG.LIST;
    case value instanceof Int32Array: return TAG.INT_ARRAY;
    case value instanceof BigInt64Array: return TAG.LONG_ARRAY;
    case typeof value === "object" && value !== null: return TAG.COMPOUND;
    default: return null;
  }
}

// primitive

type CustomInspectFunction = import("node:util").CustomInspectFunction;

const CustomInspect = Symbol.for("nodejs.util.inspect.custom");

class Int8<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int8" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}b`,"number");
  }
}

class Int16<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int16" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}s`,"number");
  }
}

class Int32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int32" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return () => this.valueOf();
  }
}

class Float32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Float32" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}f`,"number");
  }
}