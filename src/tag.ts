import { Int8, Int16, Int32, Float32 } from "./primitive.js";

export type RootTag = CompoundTag | ListTag<Tag>;

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

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

export interface ListTag<T extends Tag> extends Array<T> {}

export interface ListTagUnsafe<T extends Tag> extends Array<T | unknown> {}

export interface CompoundTag {
  [name: string]: Tag | undefined;
}

export interface CompoundTagUnsafe {
  [name: string]: unknown;
}

export type IntArrayTag = Int32Array;

export type LongArrayTag = BigInt64Array;

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

export function fromListUnsafe<T extends Tag>(value: ListTag<T> | ListTagUnsafe<T>): ListTag<T> {
  return (value as ListTagUnsafe<T>)
    .filter((entry): entry is T => 
      getTagType(entry) !== null
    );
}

export function fromCompoundUnsafe(value: CompoundTagUnsafe): CompoundTag {
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string,Tag] => 
        getTagType(entry[1]) !== null
      )
  );
}