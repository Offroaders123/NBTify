export type Tag = EndTag | ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag | CompoundTag | IntArrayTag | LongArrayTag;

export class EndTag {
  static readonly tag = 0;
  static readonly type = "end";

  get type() {
    return EndTag.type;
  }

  toJSON() {
    return { type: this.type };
  }
}

export class ByteTag extends Number {
  static readonly tag = 1;
  static readonly type = "byte";

  get type() {
    return ByteTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(byte: number) {
    super(byte);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class ShortTag extends Number {
  static readonly tag = 2;
  static readonly type = "short";

  get type() {
    return ShortTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(short: number) {
    super(short);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class IntTag extends Number {
  static readonly tag = 3;
  static readonly type = "int";

  get type() {
    return IntTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(int: number) {
    super(int);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class LongTag {
  static readonly tag = 4;
  static readonly type = "long";

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

export class FloatTag extends Number {
  static readonly tag = 5;
  static readonly type = "float";

  get type() {
    return FloatTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(float: number) {
    super(float);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class DoubleTag extends Number {
  static readonly tag = 6;
  static readonly type = "double";

  get type() {
    return DoubleTag.type;
  }

  get value() {
    return this.valueOf();
  }

  constructor(double: number) {
    super(double);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class ByteArrayTag extends Uint8Array {
  static readonly tag = 7;
  static readonly type = "byteArray";

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
    return { type: this.type, value: this.value };
  }
}

export class StringTag extends String {
  static readonly tag = 8;
  static readonly type = "string";

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
    return { type: this.type, value: this.value };
  }
}

export class ListTag extends Array<Tag> {
  static readonly tag = 9;
  static readonly type = "list";

  get type() {
    return ListTag.type;
  }

  get value(): Tag[] {
    return [...this];
  }

  constructor(...list: Tag[]) {
    super(...list);
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class CompoundTag extends Map<string,Tag> {
  static readonly tag = 10;
  static readonly type = "compound";

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
    return { name: this.name, type: this.type, value: this.value };
  }
}

export class IntArrayTag extends Int32Array {
  static readonly tag = 11;
  static readonly type = "intArray";

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
    return { type: this.type, value: this.value };
  }
}

export class LongArrayTag extends BigInt64Array {
  static readonly tag = 12;
  static readonly type = "longArray";

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
    return { type: this.type, value: this.value };
  }
}