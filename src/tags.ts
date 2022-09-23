export type Tag = ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

export type ByteTag = Byte;

export type ShortTag = Short;

export type IntTag = Int;

export type LongTag = bigint;

export type FloatTag = Float;

export type DoubleTag = number;

export type ByteArrayTag = Uint8Array;

export type StringTag = string;

export interface ListTag<T extends Tag = Tag> extends Array<T> {}

export interface CompoundTag {
  [name: string]: Tag;
}

export type IntArrayTag = Int32Array;

export type LongArrayTag = BigInt64Array;

export class Byte extends Number {
  static readonly MIN_VALUE = -128;
  static readonly MAX_VALUE = 127;

  constructor(value?: any) {
    if (value < Byte.MIN_VALUE || value > Byte.MAX_VALUE){
      throw new RangeError(`Byte value must be between ${Byte.MIN_VALUE} and ${Byte.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Short extends Number {
  static readonly MIN_VALUE = -32768;
  static readonly MAX_VALUE = 32767;

  constructor(value?: any) {
    if (value < Short.MIN_VALUE || value > Short.MAX_VALUE){
      throw new RangeError(`Short value must be between ${Short.MIN_VALUE} and ${Short.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Int extends Number {
  static readonly MIN_VALUE = -2147483648;
  static readonly MAX_VALUE = 2147483647;

  constructor(value?: any) {
    if (value < Int.MIN_VALUE || value > Int.MAX_VALUE){
      throw new RangeError(`Int value must be between ${Int.MIN_VALUE} and ${Int.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Float extends Number {
  static readonly MIN_VALUE = -3.4e+38;
  static readonly MAX_VALUE = 3.4e+38;

  constructor(value?: any) {
    if (value < Float.MIN_VALUE || value > Float.MAX_VALUE){
      throw new RangeError(`Float value must be between ${Float.MIN_VALUE} and ${Float.MAX_VALUE}`);
    }
    super(value);
  }
}

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
    case value instanceof Uint8Array: return "ByteArray";
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