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

console.log(readValue(fileDemo,TAG.COMPOUND,0));

})();

// read

type ReadStage = [data: Uint8Array, byteLength: number];

// trying to look into how you can build a file parser, but using functional programming techniques
// I'm getting sleepy at this coffee shop! Maybe a little hungry too hehe
// This demo is currently being run with `./test/nbt/hello_world.nbt`

function readValue(data: Uint8Array, type: TAG, byteOffset: number): Tag {
  switch (type){
    case TAG.END: {
      const remaining = data.byteLength - byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${byteOffset}, ${remaining} unread bytes remaining`);
    }
    case TAG.BYTE: return readByte(data, byteOffset);
    case TAG.SHORT: return readShort(data, byteOffset);
    case TAG.INT: return readInt(data, byteOffset);
    case TAG.LONG: return readLong(data, byteOffset);
    case TAG.FLOAT: return readFloat(data, byteOffset);
    case TAG.DOUBLE: return readDouble(data, byteOffset);
    case TAG.BYTE_ARRAY: return readByteArray(data, byteOffset);
    case TAG.STRING: return readString(data, byteOffset);
    case TAG.LIST: return readList(data, byteOffset);
    case TAG.COMPOUND: return readCompound(data, byteOffset);
    case TAG.INT_ARRAY: return readIntArray(data, byteOffset);
    case TAG.LONG_ARRAY: return readLongArray(data, byteOffset);
    default: throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${byteOffset}`);
  }
}

function readByte(data: Uint8Array, byteOffset: number): ByteTag | BooleanTag {
  readAllocate(data,1,byteOffset);
}

function readShort(data: Uint8Array, byteOffset: number): ShortTag {}

function readInt(data: Uint8Array, byteOffset: number): IntTag {}

function readLong(data: Uint8Array, byteOffset: number): LongTag {}

function readFloat(data: Uint8Array, byteOffset: number): FloatTag {}

function readDouble(data: Uint8Array, byteOffset: number): DoubleTag {}

function readByteArray(data: Uint8Array, byteOffset: number): ByteArrayTag {}

function readString(data: Uint8Array, byteOffset: number): StringTag {}

function readList(data: Uint8Array, byteOffset: number): ListTag<Tag> {}

function readCompound(data: Uint8Array, byteOffset: number): CompoundTag {}

function readIntArray(data: Uint8Array, byteOffset: number): IntArrayTag {}

function readLongArray(data: Uint8Array, byteOffset: number): LongArrayTag {}

function readAllocate(data: Uint8Array, byteOffset: number, byteLength: number): void {
  if (byteOffset + byteLength > data.byteLength){
    throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
  }
}

// write

declare function writeValue(value: Tag): Uint8Array;

function allocate(data: Uint8Array, byteOffset: number, byteLength: number): Uint8Array {
  const required = byteOffset + byteLength;
  if (data.byteLength >= required) return data;

  let length = data.byteLength;

  while (length < required){
    length *= 2;
  }

  const newData = new Uint8Array(length);
  newData.set(data,0);

  if (byteOffset > data.byteLength){
    newData.fill(0,byteLength,byteOffset);
  }

  return newData;
}

declare function writeByte(value: ByteTag | BooleanTag): Uint8Array;
declare function writeShort(value: ShortTag): Uint8Array;
declare function writeInt(value: IntTag): Uint8Array;
declare function writeLong(value: LongTag): Uint8Array;
declare function writeFloat(value: FloatTag): Uint8Array;
declare function writeDouble(value: DoubleTag): Uint8Array;
declare function writeByteArray(value: ByteArrayTag): Uint8Array;
declare function writeString(value: StringTag): Uint8Array;
declare function writeList(value: ListTag<Tag>): Uint8Array;
declare function writeCompound(value: CompoundTag): Uint8Array;
declare function writeIntArray(value: IntArrayTag): Uint8Array;
declare function writeLongArray(value: LongArrayTag): Uint8Array;

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