import { Int8, Int16, Int32, Float32 } from "./primitive.js";

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

export type RootTag = CompoundTag | ListTag<Tag>;

export type RootTagLike = CompoundTagLike | ListTagLike;

export type ByteTag<T extends number = number> = Int8<T>;

export type BooleanTag = FalseTag | TrueTag;

export type FalseTag = false | ByteTag<0>;

export type TrueTag = true | ByteTag<1>;

export type ShortTag<T extends number = number> = Int16<T>;

export type IntTag<T extends number = number> = Int32<T>;

export type LongTag = bigint;

export type FloatTag<T extends number = number> = Float32<T>;

export type DoubleTag = number;

export type ByteArrayTag = Int8Array;

export type StringTag = string;

export interface ListTag<T extends Tag | undefined> extends Array<T> {
  [NBT_LIST_TYPE]?: TAG;
}

export type ListTagLike = any[];

export interface CompoundTag {
  [name: string]: Tag | undefined;
}

export type CompoundTagLike = object;

export type IntArrayTag = Int32Array;

export type LongArrayTag = BigInt64Array;

export enum TAG {
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

export const NBT_LIST_TYPE = Symbol("nbt.list.type");

export function isTag<T extends Tag>(value: any): value is T {
  return getTagType(value) !== null;
}

export function getTagType(value: Tag): TAG;
export function getTagType(value: any): TAG | null;
export function getTagType(value: any): TAG | null {
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