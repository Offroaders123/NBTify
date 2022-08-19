export type Tag = EndTag | ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

/**
 * Primitive wrapper object for the NBT `TAG_End` type.
 * Inherits from the built-in `Number` object.
*/
export class EndTag {
  static readonly tag = 0;
  static readonly type = this.name;

  get type() {
    return EndTag.type;
  }

  toJSON() {
    return { type: this.type };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte` type.
 * Inherits from the built-in `Number` object.
*/
export class ByteTag extends Number {
  static readonly MAX_VALUE = 128;
  static readonly MIN_VALUE = -127;

  static readonly tag = 1;
  static readonly type = this.name;

  get type() {
    return ByteTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(byte: number) {
    if (byte < ByteTag.MIN_VALUE || byte > ByteTag.MAX_VALUE){
      throw new RangeError(`ByteTag value must be between ${ByteTag.MIN_VALUE} and ${ByteTag.MAX_VALUE}`);
    }
    super(byte);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Short` type.
 * Inherits from the built-in `Number` object.
*/
export class ShortTag extends Number {
  static readonly MAX_VALUE = 32767;
  static readonly MIN_VALUE = -32768;

  static readonly tag = 2;
  static readonly type = this.name;

  get type() {
    return ShortTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(short: number) {
    if (short < ShortTag.MIN_VALUE || short > ShortTag.MAX_VALUE){
      throw new RangeError(`ShortTag value must be between ${ShortTag.MIN_VALUE} and ${ShortTag.MAX_VALUE}`);
    }
    super(short);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int` type.
 * Inherits from the built-in `Number` object.
*/
export class IntTag extends Number {
  static readonly MAX_VALUE = 2147483647;
  static readonly MIN_VALUE = -2147483648;

  static readonly tag = 3;
  static readonly type = this.name;

  get type() {
    return IntTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(int: number) {
    if (int < IntTag.MIN_VALUE || int > IntTag.MAX_VALUE){
      throw new RangeError(`IntTag value must be between ${IntTag.MIN_VALUE} and ${IntTag.MAX_VALUE}`);
    }
    super(int);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long` type.
 * *Note: I plan to have this inherit from `BigInt`, but that hasn't found to be possible with the standard ES6 `extends` syntax yet :{
*/
export class LongTag {
  static readonly tag = 4;
  static readonly type = this.name;

  readonly value;

  get type() {
    return LongTag.type;
  }

  constructor(long: bigint) {
    this.value = long;
  }

  toJSON() {
    return { type: this.type, value: `${this.value}` };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Float` type.
 * Inherits from the built-in `Number` object.
*/
export class FloatTag extends Number {
  static readonly MAX_VALUE = 3.4e+38;
  static readonly MIN_VALUE = -3.4e+38;

  static readonly tag = 5;
  static readonly type = this.name;

  get type() {
    return FloatTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(float: number) {
    if (float < FloatTag.MIN_VALUE || float > FloatTag.MAX_VALUE){
      throw new RangeError(`FloatTag value must be between ${FloatTag.MIN_VALUE} and ${FloatTag.MAX_VALUE}`);
    }
    super(float);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Double` type.
 * Inherits from the built-in `Number` object.
*/
export class DoubleTag extends Number {
  static readonly tag = 6;
  static readonly type = this.name;

  get type() {
    return DoubleTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(double: number) {
    if (double < DoubleTag.MIN_VALUE || double > DoubleTag.MAX_VALUE){
      throw new RangeError(`DoubleTag value must be between ${DoubleTag.MIN_VALUE} and ${DoubleTag.MAX_VALUE}`);
    }
    super(double);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte_Array` type.
 * Inherits from the built-in `Uint8Array` object.
*/
export class ByteArrayTag extends Uint8Array {
  static readonly tag = 7;
  static readonly type = this.name;

  get type() {
    return ByteArrayTag.type;
  }

  get value() {
    return [...this];
  }

  constructor(byteArray: Uint8Array) {
    super(byteArray);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_String` type.
 * Inherits from the built-in `String` object.
*/
export class StringTag extends String {
  static readonly tag = 8;
  static readonly type = this.name;

  get type() {
    return StringTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(string: string) {
    super(string);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_List` type.
 * Inherits from the built-in `Array` object.
*/
export class ListTag extends Array<Tag> {
  static readonly tag = 9;
  static readonly type = this.name;

  get type() {
    return ListTag.type;
  }

  constructor(...list: Tag[]) {
    super(...list);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Compound` type.
 * Inherits from the built-in `Map` object.
*/
export class CompoundTag extends Map<string,Tag> {
  static readonly tag = 10;
  static readonly type = this.name;

  readonly name;

  get type() {
    return CompoundTag.type;
  }

  get value() {
    return Object.fromEntries(this) as { [key: string]: Tag };
  }

  constructor(name: string, compound: { [key: string]: Tag }) {
    super(Object.entries(compound));
    this.name = name;
  }

  toJSON() {
    return { name: this.name, type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int_Array` type.
 * Inherits from the built-in `Int32Array` object.
*/
export class IntArrayTag extends Int32Array {
  static readonly tag = 11;
  static readonly type = this.name;

  get type() {
    return IntArrayTag.type;
  }

  get value() {
    return [...this];
  }

  constructor(intArray: Int32Array) {
    super(intArray);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long_Array` type.
 * Inherits from the built-in `BigInt64Array` object.
*/
export class LongArrayTag extends BigInt64Array {
  static readonly tag = 12;
  static readonly type = this.name;

  get type() {
    return LongArrayTag.type;
  }

  get value() {
    return [...this].map(item => `${item}`);
  }

  constructor(longArray: BigInt64Array) {
    super(longArray);
  }

  toJSON() {
    return { type: this.type, value: this.valueOf() };
  }
}