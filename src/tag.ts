import { Byte, Short, Int, Float } from "./primitive.js";

export type Tag = BooleanTag | ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

export type BooleanTag = boolean | 0 | 1;

export type ByteTag = Byte;

export type ShortTag = Short;

export type IntTag = Int;

export type LongTag = bigint;

export type FloatTag = Float;

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