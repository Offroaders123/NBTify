export type Tag = EndTag | ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;
export type TagByte = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Primitive wrapper object for the NBT `TAG_End` type.
 * Inherits from the built-in `Number` object.
*/
export class EndTag {
  static readonly TAG_BYTE: TagByte = 0;
  static readonly TYPE = "end";

  toJSON() {
    return { type: EndTag.TYPE };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte` type.
 * Inherits from the built-in `Number` object.
*/
export class ByteTag extends Number {
  static readonly MAX_VALUE = 128;
  static readonly MIN_VALUE = -127;

  static readonly TAG_BYTE: TagByte = 1;
  static readonly TYPE = "byte";

  constructor(value?: any) {
    if (value < ByteTag.MIN_VALUE || value > ByteTag.MAX_VALUE){
      throw new RangeError(`ByteTag value must be between ${ByteTag.MIN_VALUE} and ${ByteTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: ByteTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Short` type.
 * Inherits from the built-in `Number` object.
*/
export class ShortTag extends Number {
  static readonly MAX_VALUE = 32767;
  static readonly MIN_VALUE = -32768;

  static readonly TAG_BYTE: TagByte = 2;
  static readonly TYPE = "short";

  constructor(value?: any) {
    if (value < ShortTag.MIN_VALUE || value > ShortTag.MAX_VALUE){
      throw new RangeError(`ShortTag value must be between ${ShortTag.MIN_VALUE} and ${ShortTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: ShortTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int` type.
 * Inherits from the built-in `Number` object.
*/
export class IntTag extends Number {
  static readonly MAX_VALUE = 2147483647;
  static readonly MIN_VALUE = -2147483648;

  static readonly TAG_BYTE: TagByte = 3;
  static readonly TYPE = "int";

  constructor(value?: any) {
    if (value < IntTag.MIN_VALUE || value > IntTag.MAX_VALUE){
      throw new RangeError(`IntTag value must be between ${IntTag.MIN_VALUE} and ${IntTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: IntTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long` type.
 * *Note: I plan to have this inherit from `BigInt`, but that hasn't found to be possible with the standard ES6 `extends` syntax yet :{
*/
export class LongTag {
  static readonly TAG_BYTE: TagByte = 4;
  static readonly TYPE = "long";

  readonly value;

  constructor(value: string | number | bigint | boolean) {
    this.value = BigInt(value);
  }

  toJSON() {
    return { type: LongTag.TYPE, value: `${this.value}` };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Float` type.
 * Inherits from the built-in `Number` object.
*/
export class FloatTag extends Number {
  static readonly MAX_VALUE = 3.4e+38;
  static readonly MIN_VALUE = -3.4e+38;

  static readonly TAG_BYTE: TagByte = 5;
  static readonly TYPE = "float";

  constructor(value?: any) {
    if (value < FloatTag.MIN_VALUE || value > FloatTag.MAX_VALUE){
      throw new RangeError(`FloatTag value must be between ${FloatTag.MIN_VALUE} and ${FloatTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: FloatTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Double` type.
 * Inherits from the built-in `Number` object.
*/
export class DoubleTag extends Number {
  static readonly TAG_BYTE: TagByte = 6;
  static readonly TYPE = "double";

  toJSON() {
    return { type: DoubleTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte_Array` type.
 * Inherits from the built-in `Uint8Array` object.
*/
export class ByteArrayTag extends Uint8Array {
  static readonly TAG_BYTE: TagByte = 7;
  static readonly TYPE = "byteArray";

  toJSON() {
    return { type: ByteArrayTag.TYPE, value: [...this] };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_String` type.
 * Inherits from the built-in `String` object.
*/
export class StringTag extends String {
  static readonly TAG_BYTE: TagByte = 8;
  static readonly TYPE = "string";

  toJSON() {
    return { type: StringTag.TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_List` type.
 * Inherits from the built-in `Array` object.
*/
export class ListTag extends Array<Tag> {
  static readonly TAG_BYTE: TagByte = 9;
  static readonly TYPE = "list";

  toJSON() {
    return { type: ListTag.TYPE, value: [...this] as Tag[] };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Compound` type.
 * Inherits from the built-in `Map` object.
*/
export class CompoundTag extends Map<string,Tag> {
  static readonly TAG_BYTE: TagByte = 10;
  static readonly TYPE = "compound";

  readonly name;

  constructor(name: string, compound: { [key: string]: Tag }) {
    super(Object.entries(compound));
    this.name = name;
  }

  toJSON() {
    return { name: this.name, type: CompoundTag.TYPE, value: Object.fromEntries(this) };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int_Array` type.
 * Inherits from the built-in `Int32Array` object.
*/
export class IntArrayTag extends Int32Array {
  static readonly TAG_BYTE: TagByte = 11;
  static readonly TYPE = "intArray";

  toJSON() {
    return { type: IntArrayTag.TYPE, value: [...this] };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long_Array` type.
 * Inherits from the built-in `BigInt64Array` object.
*/
export class LongArrayTag extends BigInt64Array {
  static readonly TAG_BYTE: TagByte = 12;
  static readonly TYPE = "longArray";

  toJSON() {
    return { type: LongArrayTag.TYPE, value: [...this].map(entry => `${entry}`) };
  }
}