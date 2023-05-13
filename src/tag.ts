import { Int8, Int16, Int32, Float32 } from "./primitive.js";

export type TAG = typeof TAG[keyof typeof TAG];

export const TAG = {
  END: 0,
  BYTE: 1,
  SHORT: 2,
  INT: 3,
  LONG: 4,
  FLOAT: 5,
  DOUBLE: 6,
  BYTE_ARRAY: 7,
  STRING: 8,
  LIST: 9,
  COMPOUND: 10,
  INT_ARRAY: 11,
  LONG_ARRAY: 12
} as const;

Object.freeze(TAG);

export type Tag =
  | ByteTag
  | BooleanTag
  | ShortTag
  | IntTag
  | LongTag
  | FloatTag
  | DoubleTag
  | ByteArrayTag
  | StringTag
  | ListTag
  | CompoundTag
  | IntArrayTag
  | LongArrayTag;

export type ByteTag<T extends number = number> = Int8<T>;

export type BooleanTag = boolean | ByteTag<0 | 1>;

export type ShortTag<T extends number = number> = Int16<T>;

export type IntTag<T extends number = number> = Int32<T>;

export type LongTag = bigint;

export type FloatTag<T extends number = number> = Float32<T>;

export type DoubleTag = number;

export type ByteArrayTag = Int8Array;

export type StringTag = string;

export interface ListTag<T extends Tag = Tag> extends Array<T> {}

export interface CompoundTag {
  [name: string]: Tag;
}

export type IntArrayTag = Int32Array;

export type LongArrayTag = BigInt64Array;