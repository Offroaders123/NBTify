/**
 * @typedef { EndTag | ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag } Tag
 * @typedef { 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 } TagByte
*/

/**
 * Returns whether a provided value is an instance of a tag class.
 * 
 * @param { any } [arg]
 * @returns { arg is Tag }
*/
export function isTag(arg) {
  switch (true){
    case arg instanceof EndTag:
    case arg instanceof ByteTag:
    case arg instanceof ShortTag:
    case arg instanceof IntTag:
    case arg instanceof LongTag:
    case arg instanceof FloatTag:
    case arg instanceof DoubleTag:
    case arg instanceof ByteArrayTag:
    case arg instanceof StringTag:
    case arg instanceof ListTag:
    case arg instanceof CompoundTag:
    case arg instanceof IntArrayTag:
    case arg instanceof LongArrayTag:
      return true;
    default:
      return false;
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_End` type.
*/
export class EndTag {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 0;
  /** @readonly */
  static TAG_TYPE = "end";

  toJSON() {
    return { type: EndTag.TAG_TYPE };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte` type.
 * 
 * Inherits from the built-in `Number` object.
*/
export class ByteTag extends Number {
  /** @readonly */
  static MAX_VALUE = 128;
  /** @readonly */
  static MIN_VALUE = -127;

  /** @type { TagByte } @readonly */
  static TAG_BYTE = 1;
  /** @readonly */
  static TAG_TYPE = "byte";

  /** @param { any } [value] */
  constructor(value) {
    if (value < ByteTag.MIN_VALUE || value > ByteTag.MAX_VALUE){
      throw new RangeError(`ByteTag value must be between ${ByteTag.MIN_VALUE} and ${ByteTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: ByteTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Short` type.
 * 
 * Inherits from the built-in `Number` object.
*/
export class ShortTag extends Number {
  /** @readonly */
  static MAX_VALUE = 32767;
  /** @readonly */
  static MIN_VALUE = -32768;

  /** @type { TagByte } @readonly */
  static TAG_BYTE = 2;
  /** @readonly */
  static TAG_TYPE = "short";

  /** @param { any } [value] */
  constructor(value) {
    if (value < ShortTag.MIN_VALUE || value > ShortTag.MAX_VALUE){
      throw new RangeError(`ShortTag value must be between ${ShortTag.MIN_VALUE} and ${ShortTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: ShortTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int` type.
 * 
 * Inherits from the built-in `Number` object.
*/
export class IntTag extends Number {
  /** @readonly */
  static MAX_VALUE = 2147483647;
  /** @readonly */
  static MIN_VALUE = -2147483648;

  /** @type { TagByte } @readonly */
  static TAG_BYTE = 3;
  /** @readonly */
  static TAG_TYPE = "int";

  /** @param { any } [value] */
  constructor(value) {
    if (value < IntTag.MIN_VALUE || value > IntTag.MAX_VALUE){
      throw new RangeError(`IntTag value must be between ${IntTag.MIN_VALUE} and ${IntTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: IntTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long` type.
 * 
 * Ideally this would inherit from `BigInt`, to be
 * consistent with how the other tags inheriting from their
 * built-in equivalents. However, it doesn't seem to be possible
 * because `BigInt` isn't a constructor.
*/
export class LongTag {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 4;
  /** @readonly */
  static TAG_TYPE = "long";

  #value;

  /**
   * A public-facing view of the private `[[PrimitiveValue]]`
   * for the tag.
   * 
   * This property is merely for displaying the tag's value in
   * the console, as a placeholder for being unable to inherit
   * the `BigInt` object. Use `valueOf()` to access the value
   * instead.
   * 
   * @readonly
  */
  value;

  /** @param { string | number | bigint | boolean } value */
  constructor(value) {
    this.#value = BigInt(value);
    this.value = this.#value;

    Object.defineProperty(this,"value",{
      configurable: false,
      writable: false
    });
  }

  valueOf() {
    return this.#value;
  }

  toJSON() {
    return { type: LongTag.TAG_TYPE, value: `${this.valueOf()}` };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Float` type.
 * 
 * Inherits from the built-in `Number` object.
*/
export class FloatTag extends Number {
  /** @readonly */
  static MAX_VALUE = 3.4e+38;
  /** @readonly */
  static MIN_VALUE = -3.4e+38;

  /** @type { TagByte } @readonly */
  static TAG_BYTE = 5;
  /** @readonly */
  static TAG_TYPE = "float";

  /** @param { any } [value] */
  constructor(value) {
    if (value < FloatTag.MIN_VALUE || value > FloatTag.MAX_VALUE){
      throw new RangeError(`FloatTag value must be between ${FloatTag.MIN_VALUE} and ${FloatTag.MAX_VALUE}`);
    }
    super(value);
  }

  toJSON() {
    return { type: FloatTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Double` type.
 * 
 * Inherits from the built-in `Number` object.
*/
export class DoubleTag extends Number {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 6;
  /** @readonly */
  static TAG_TYPE = "double";

  toJSON() {
    return { type: DoubleTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Byte_Array` type.
 * 
 * Inherits from the built-in `Uint8Array` object.
*/
export class ByteArrayTag extends Uint8Array {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 7;
  /** @readonly */
  static TAG_TYPE = "byteArray";

  toJSON() {
    return { type: ByteArrayTag.TAG_TYPE, value: [...this] };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_String` type.
 * 
 * Inherits from the built-in `String` object.
*/
export class StringTag extends String {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 8;
  /** @readonly */
  static TAG_TYPE = "string";

  toJSON() {
    return { type: StringTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_List` type.
 * 
 * Inherits from the built-in `Array` object.
*/
export class ListTag extends Array {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 9;
  /** @readonly */
  static TAG_TYPE = "list";

  valueOf() {
    return /** @type { Tag[] } */ ([...this]);
  }

  toJSON() {
    return { type: ListTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Compound` type.
 * 
 * Inherits from the built-in `Map` object.
*/
export class CompoundTag extends Map {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 10;
  /** @readonly */
  static TAG_TYPE = "compound";

  /** @readonly */
  static ROOT_NAME = Symbol("ROOT_NAME");

  /**
   * Optionally excepts an object as the only parameter.
   * 
   * Non-string keys will be automatically converted to their string
   * equivalents.
   * 
   * If the key's value is not an instance of a tag class, the constructor
   * will be thrown with a `TypeError`.
   * 
   * Also optionally accepts a name string for the `CompoundTag` using the `Symbol`
   * key `[CompoundTag.ROOT_NAME]`. Note that this will only be used for the root
   * tag if it is present.
   * 
   * @param { { [CompoundTag.ROOT_NAME]?: string, [name: string]: Tag } } [value]
  */
  constructor(value = {}) {
    for (const entry of Object.values(value)){
      if (!isTag(entry)){
        throw new TypeError(`CompoundTag entry values must be instances of valid tag types, instead received type ${typeof entry}`);
      }
    }
    super(Object.entries(value));

    const { [CompoundTag.ROOT_NAME]: name } = value;
    if (name !== undefined){
      /** @type { string | undefined } */
      this.name = name;
    }
  }

  valueOf() {
    return /** @type { { [name: string]: Tag } } */ (Object.fromEntries(this));
  }

  toJSON() {
    const metadata = Object.fromEntries(Object.entries(this));
    return { ...metadata, type: CompoundTag.TAG_TYPE, value: this.valueOf() };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Int_Array` type.
 * 
 * Inherits from the built-in `Int32Array` object.
*/
export class IntArrayTag extends Int32Array {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 11;
  /** @readonly */
  static TAG_TYPE = "intArray";

  toJSON() {
    return { type: IntArrayTag.TAG_TYPE, value: [...this] };
  }
}

/**
 * Primitive wrapper object for the NBT `TAG_Long_Array` type.
 * 
 * Inherits from the built-in `BigInt64Array` object.
*/
export class LongArrayTag extends BigInt64Array {
  /** @type { TagByte } @readonly */
  static TAG_BYTE = 12;
  /** @readonly */
  static TAG_TYPE = "longArray";

  toJSON() {
    return { type: LongArrayTag.TAG_TYPE, value: [...this].map(entry => `${entry}`) };
  }
}