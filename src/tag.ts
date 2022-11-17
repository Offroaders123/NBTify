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

export type TAG_TYPE = typeof TAG_END | typeof TAG_BYTE | typeof TAG_SHORT | typeof TAG_INT | typeof TAG_LONG | typeof TAG_FLOAT | typeof TAG_DOUBLE | typeof TAG_BYTE_ARRAY | typeof TAG_STRING | typeof TAG_LIST | typeof TAG_COMPOUND | typeof TAG_INT_ARRAY | typeof TAG_LONG_ARRAY;

export const TAG_END = 0;

export const TAG_BYTE = 1;

export const TAG_SHORT = 2;

export const TAG_INT = 3;

export const TAG_LONG = 4;

export const TAG_FLOAT = 5;

export const TAG_DOUBLE = 6;

export const TAG_BYTE_ARRAY = 7;

export const TAG_STRING = 8;

export const TAG_LIST = 9;

export const TAG_COMPOUND = 10;

export const TAG_INT_ARRAY = 11;

export const TAG_LONG_ARRAY = 12;

export function getTagType(value: Tag): TAG_TYPE {
  switch (true){
    case value instanceof Byte: return TAG_BYTE;
    case value instanceof Short: return TAG_SHORT;
    case value instanceof Int: return TAG_INT;
    case typeof value === "bigint": return TAG_LONG;
    case value instanceof Float: return TAG_FLOAT;
    case typeof value === "number": return TAG_DOUBLE;
    case value instanceof Int8Array: return TAG_BYTE_ARRAY;
    case typeof value === "string": return TAG_STRING;
    case value instanceof Array: return TAG_LIST;
    case typeof value === "object" && Object.getPrototypeOf(value).isPrototypeOf(Object): return TAG_COMPOUND;
    case value instanceof Int32Array: return TAG_INT_ARRAY;
    case value instanceof BigInt64Array: return TAG_LONG_ARRAY;
    default: throw new TypeError(`Encountered unsupported tag type ${typeof value}`);
  }
}