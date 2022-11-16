import { Byte, Short, Int, Float } from "./primitive.js";

export type Tag = ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

export type ByteTag<T extends number = number> = Byte<T>;

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

export type TagType = keyof typeof TAG_BYTE;

export type TagByte = typeof TAG_BYTE[TagType];

export const TAG_BYTE = {
  End: 0,
  Byte: 1,
  Short: 2,
  Int: 3,
  Long: 4,
  Float: 5,
  Double: 6,
  ByteArray: 7,
  String: 8,
  List: 9,
  Compound: 10,
  IntArray: 11,
  LongArray: 12
} as const;

export function getTagType(value: Tag): TagType {
  switch (true){
    case value instanceof Byte: return "Byte";
    case value instanceof Short: return "Short";
    case value instanceof Int: return "Int";
    case typeof value === "bigint": return "Long";
    case value instanceof Float: return "Float";
    case typeof value === "number": return "Double";
    case value instanceof Int8Array: return "ByteArray";
    case typeof value === "string": return "String";
    case value instanceof Array: return "List";
    case typeof value === "object" && Object.getPrototypeOf(value).isPrototypeOf(Object): return "Compound";
    case value instanceof Int32Array: return "IntArray";
    case value instanceof BigInt64Array: return "LongArray";
    default: throw new TypeError(`Encountered unsupported tag type ${typeof value}`);
  }
}

export function getTagByte(value: Tag): TagByte {
  const type = getTagType(value);
  return TAG_BYTE[type];
}