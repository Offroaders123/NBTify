import { Int8, Int16, Int32, Float32 } from "./primitive.js";

export type RootTag = CompoundTag | ListTag<Tag>;

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

export class ByteTag<T extends number = number> extends Int8<T> {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "ByteTag" as const;
  }
}

export class BooleanTag<T extends boolean = boolean> extends Boolean {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "BooleanTag" as const;
  }
}

export class ShortTag<T extends number = number> extends Int16<T> {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "ShortTag" as const;
  }
}

export class IntTag<T extends number = number> extends Int32<T> {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "IntTag" as const;
  }
}

export class LongTag<T extends bigint = bigint> {
  constructor(private readonly value: T) {}

  valueOf() {
    return this.value as T;
  }

  get [Symbol.toStringTag]() {
    return "LongTag" as const;
  }
}

export class FloatTag<T extends number = number> extends Float32<T> {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "FloatTag" as const;
  }
}

export class DoubleTag<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "DoubleTag" as const;
  }
}

export class ByteArrayTag extends Int8Array {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "ByteArrayTag" as const;
  }
}

export class StringTag<T extends string = string> extends String {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "StringTag" as const;
  }
}

export class ListTag<T extends Tag> extends Array<T> {
  constructor(...value: T[]) {
    value = value.filter(entry => getTagType(entry) !== null);
    super(...value);
  }

  get [Symbol.toStringTag]() {
    return "ListTag" as const;
  }
}

export class CompoundTag<T extends Record<string,Tag | undefined> = Record<string,Tag | undefined>> {
  [name: string]: Tag | undefined;

  constructor(value: T = {} as T) {
    value = Object.fromEntries(
      Object.entries(value)
        .filter((entry): entry is [string,Tag] => 
          getTagType(entry[1]) !== null
        )
    ) as T;
    Object.assign(this,value);
  }

  get [Symbol.toStringTag]() {
    return "CompoundTag" as const;
  }
}

export class IntArrayTag extends Int32Array {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "IntArrayTag" as const;
  }
}

export class LongArrayTag extends BigInt64Array {
  // @ts-expect-error
  get [Symbol.toStringTag]() {
    return "LongArrayTag" as const;
  }
}

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
    case value instanceof ByteTag: return TAG.BYTE;
    case value instanceof ShortTag: return TAG.SHORT;
    case value instanceof IntTag: return TAG.INT;
    case value instanceof LongTag: return TAG.LONG;
    case value instanceof FloatTag: return TAG.FLOAT;
    case value instanceof DoubleTag: return TAG.DOUBLE;
    case value instanceof ByteArrayTag: return TAG.BYTE_ARRAY;
    case value instanceof StringTag: return TAG.STRING;
    case value instanceof ListTag: return TAG.LIST;
    case value instanceof IntArrayTag: return TAG.INT_ARRAY;
    case value instanceof LongArrayTag: return TAG.LONG_ARRAY;
    case value instanceof CompoundTag: return TAG.COMPOUND;
    default: return null;
  }
}