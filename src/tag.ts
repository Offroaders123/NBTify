import { Byte, Short, Int, Float } from "./primitive.js";

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

export type ByteTag<T extends number = number> = Byte<T>;

export type BooleanTag = boolean | ByteTag<0 | 1>;

export type ShortTag<T extends number = number> = Short<T>;

export type IntTag<T extends number = number> = Int<T>;

export type LongTag = bigint;

export type FloatTag<T extends number = number> = Float<T>;

export type DoubleTag = number;

export type ByteArrayTag = Int8Array;

export type StringTag = string;

export interface ListTag<T extends Tag = Tag> extends Array<T> {}

export interface CompoundTag {
  [name: string]: Tag;
}

export type IntArrayTag = Int32Array;

export type LongArrayTag = BigInt64Array;

export const enum TAG {
  END,
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

export function getType(value: Tag): TAG {
  switch (true){
    case value instanceof Byte: return TAG.BYTE;
    case value instanceof Short: return TAG.SHORT;
    case value instanceof Int: return TAG.INT;
    case typeof value === "bigint": return TAG.LONG;
    case value instanceof Float: return TAG.FLOAT;
    case typeof value === "number": return TAG.DOUBLE;
    case value instanceof Int8Array: return TAG.BYTE_ARRAY;
    case typeof value === "string": return TAG.STRING;
    case value instanceof Array: return TAG.LIST;
    case typeof value === "object" && Object.getPrototypeOf(value).isPrototypeOf(Object): return TAG.COMPOUND;
    case value instanceof Int32Array: return TAG.INT_ARRAY;
    case value instanceof BigInt64Array: return TAG.LONG_ARRAY;
    default: throw new TypeError(`${Object.prototype.toString.call(value)} is not a valid NBT primitive`);
  }
}