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

function read(data: Uint8Array){
  return new NBTReader().readRoot(data);
}

class NBTReader {
  private data!: Uint8Array;

  readRoot(data: Uint8Array): RootTag {
    this.data = data;
    return this.readTag();
  }

  readTag(): Tag {
    const type = this.readType();
  }

  readType(): TAG {}
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