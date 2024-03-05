// elxport * from "./read.js";
// elxport * from "./write.js";
// elxport * from "./parse.js";
// elxport * from "./stringify.js";
// elxport * from "./format.js";
// elxport * from "./tag.js";
// elxport * from "./primitive.js";
// elxport * from "./error.js";
// elxport * from "./compression.js";

import { readFile, writeFile } from "node:fs/promises";

(async () => {

const fileDemo = await readFile(process.argv[2]!);
console.log(fileDemo);

const readDemo = await read(fileDemo,false,false,false);
console.log(readDemo);

const writeDemo = Buffer.from((await write(readDemo,false)).buffer);
console.log(writeDemo);
console.log(Buffer.compare(fileDemo, writeDemo)); //, fileDemo[0x37], writeDemo[0x37]);

await writeFile(`${process.argv[2]!}2.nbt`,writeDemo);

})();

// format

type NBTData = [string | null, RootTag, boolean];

// read

async function read(data: Uint8Array, rootName: boolean = true, littleEndian: boolean = false, bedrockLevel: boolean = false): Promise<NBTData> {
  const reader = new DataReader(data);
  return readRoot(reader, rootName, littleEndian, bedrockLevel);
}

async function readRoot(reader: DataReader, rootName: boolean, littleEndian: boolean, bedrockLevel: boolean): Promise<NBTData> {
  if (bedrockLevel){
    // const version =
      reader.readUint32(littleEndian);
    console.log(reader.readUint32(littleEndian));
  }

  const type = reader.readUint8();
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
  }

  // typeof this.#rootName === "string" || this.#rootName ? this.#readString() : null
  const rootNameV = rootName ? readString(reader, littleEndian) : null;
  const root: RootTag = readTag(reader, type, littleEndian) as RootTag; // maybe make this generic as well?

  return [rootNameV, root, bedrockLevel];
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

async function write(data: NBTData, littleEndian: boolean = false): Promise<Uint8Array> {
  const writer = new DataWriter();
  return writeRoot(data, writer, littleEndian);
}

async function writeRoot(data: NBTData, writer: DataWriter, littleEndian: boolean): Promise<Uint8Array> {
  const [rootName, root, bedrockLevel] = data;
  const type = getTagType(root);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
  }

  if (bedrockLevel){
    writer.writeFloat64(0, littleEndian);
  }

  writer.writeUint8(type);
  if (rootName !== null) writeString(writer, rootName, littleEndian);
  writeTag(writer, root, littleEndian);

  if (bedrockLevel){
    if (littleEndian !== true){
      throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
    }
    if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)){
      throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
    }
    const version: number = root["StorageVersion"].valueOf();
    const byteLength = writer.byteOffset - 8;
    console.log(byteLength);
    writer.view.setUint32(0, version, littleEndian);
    writer.view.setUint32(4, byteLength, littleEndian);
  }

  return writer.trimmedEnd();
}

function writeTag(writer: DataWriter, value: Tag, littleEndian: boolean): Uint8Array {
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

function writeByte(writer: DataWriter, value: ByteTag | BooleanTag): Uint8Array {
  writer.writeInt8(Number(value.valueOf()));
}

function writeShort(writer: DataWriter, value: ShortTag, littleEndian: boolean): Uint8Array {
  writer.writeInt16(value.valueOf(), littleEndian);
}

function writeInt(writer: DataWriter, value: IntTag, littleEndian: boolean): Uint8Array {
  writer.writeInt32(value.valueOf(), littleEndian);
}

function writeLong(writer: DataWriter, value: LongTag, littleEndian: boolean): Uint8Array {
  writer.writeBigInt64(value, littleEndian);
}

function writeFloat(writer: DataWriter, value: FloatTag, littleEndian: boolean): Uint8Array {
  writer.writeFloat32(value.valueOf(), littleEndian);
}

function writeDouble(writer: DataWriter, value: DoubleTag, littleEndian: boolean): Uint8Array {
  writer.writeFloat64(value, littleEndian);
}

function writeByteArray(writer: DataWriter, value: ByteArrayTag, littleEndian: boolean): Uint8Array {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt8Array(value);
}

function writeString(writer: DataWriter, value: StringTag, littleEndian: boolean): Uint8Array {
  writer.writeUint16(Buffer.from(value).byteLength, littleEndian);
  writer.writeString(value);
}

function writeList(writer: DataWriter, value: ListTag<Tag>, littleEndian: boolean): Uint8Array {
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

function writeCompound(writer: DataWriter, value: CompoundTag, littleEndian: boolean): Uint8Array {
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

function writeIntArray(writer: DataWriter, value: IntArrayTag, littleEndian: boolean): Uint8Array {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt32Array(value, littleEndian);
}

function writeLongArray(writer: DataWriter, value: LongArrayTag, littleEndian: boolean): Uint8Array {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeBigInt64Array(value, littleEndian);
}

type WriterMethod = {
  [K in keyof DataView]: K extends `set${infer T}` ? T : never;
}[keyof DataView];

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
    this.write("Float64", 8, littleEndian, value);
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
    this.view[`set${type}`]((this.byteOffset += byteLength) - byteLength, value as never, littleEndian);
  }

  writeInt8Array(value: Int8Array): void {
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

  writeInt32Array(value: Int32Array, littleEndian: boolean): void {
    for (const entry of value){
      this.writeInt32(entry, littleEndian);
    }
  }

  writeBigInt64Array(value: BigInt64Array, littleEndian: boolean): void {
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