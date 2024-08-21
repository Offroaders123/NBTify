import { Int8, Int16, Int32, Float32 } from "./primitive.js";

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

export type RootTag = CompoundTag | ListTag<Tag>;

export type RootTagLike = CompoundTagLike | ListTagLike;

export type ByteTag<T extends number = number> = Int8<NumberLike<T>>;

export type BooleanTag = FalseTag | TrueTag;

export type FalseTag = false | ByteTag<0>;

export type TrueTag = true | ByteTag<1>;

export type ShortTag<T extends number = number> = Int16<NumberLike<T>>;

export type IntTag<T extends number = number> = Int32<NumberLike<T>>;

export type LongTag<T extends bigint = bigint> = T;

export type FloatTag<T extends number = number> = Float32<NumberLike<T>>;

export type DoubleTag<T extends number = number> = NumberLike<T>;

export type ByteArrayTag = Int8Array | Uint8Array;

export type StringTag<T extends string = string> = StringLike<T>;

export interface ListTag<T extends Tag | undefined> extends Array<T> {
  [TAG_TYPE]?: TAG;
}

export type ListTagLike = any[];

export interface CompoundTag {
  [name: string]: Tag | undefined;
}

export type CompoundTagLike = object;

export type IntArrayTag = Int32Array | Uint32Array;

export type LongArrayTag = BigInt64Array | BigUint64Array;

export type NumberLike<T extends number> = `${T}` extends `${infer N extends number}` ? N : never;

export type StringLike<T extends string> = `${T}`;

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

export const TAG_TYPE = Symbol("nbtify.tag.type");

export function isTag<T extends Tag>(value: unknown): value is T {
  return getTagType(value) !== null;
}

export function isTagType(type: unknown): type is TAG {
  return typeof type === "number" && type in TAG;
}

export function getTagType(value: Tag): TAG;
export function getTagType(value: unknown): TAG | null;
export function getTagType(value: unknown): TAG | null {
  switch (true) {
    case value instanceof Int8:
    case typeof value === "boolean": return TAG.BYTE;
    case value instanceof Int16: return TAG.SHORT;
    case value instanceof Int32: return TAG.INT;
    case typeof value === "bigint": return TAG.LONG;
    case value instanceof Float32: return TAG.FLOAT;
    case typeof value === "number": return TAG.DOUBLE;
    case value instanceof Int8Array:
    case value instanceof Uint8Array: return TAG.BYTE_ARRAY;
    case typeof value === "string": return TAG.STRING;
    case value instanceof Array: return TAG.LIST;
    case value instanceof Int32Array:
    case value instanceof Uint32Array: return TAG.INT_ARRAY;
    case value instanceof BigInt64Array:
    case value instanceof BigUint64Array: return TAG.LONG_ARRAY;
    case typeof value === "object" && value !== null: return TAG.COMPOUND;
    default: return null;
  }
}