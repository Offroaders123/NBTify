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

export class ByteTag {
  static readonly tag = 1;
  static readonly type = "byte";

  readonly value;

  get type() {
    return ByteTag.type;
  }

  constructor(byte: number) {
    this.value = byte;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class ShortTag {
  static readonly tag = 2;
  static readonly type = "short";

  readonly value;

  get type() {
    return ShortTag.type;
  }

  constructor(short: number) {
    this.value = short;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class IntTag {
  static readonly tag = 3;
  static readonly type = "int";

  readonly value;

  get type() {
    return IntTag.type;
  }

  constructor(int: number) {
    this.value = int;
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
    return { type: this.type, value: this.value };
  }
}

export class FloatTag {
  static readonly tag = 5;
  static readonly type = "float";

  readonly value;

  get type() {
    return FloatTag.type;
  }

  constructor(float: number) {
    this.value = float;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class DoubleTag {
  static readonly tag = 6;
  static readonly type = "double";

  readonly value;

  get type() {
    return DoubleTag.type;
  }

  constructor(double: number) {
    this.value = double;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class ByteArrayTag {
  static readonly tag = 7;
  static readonly type = "byteArray";

  readonly value;

  get type() {
    return ByteArrayTag.type;
  }

  constructor(byteArray: Uint8Array) {
    this.value = byteArray;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class StringTag {
  static readonly tag = 8;
  static readonly type = "string";

  readonly value;

  get type() {
    return StringTag.type;
  }

  constructor(string: string) {
    this.value = string;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class ListTag {
  static readonly tag = 9;
  static readonly type = "list";

  readonly value;

  get type() {
    return ListTag.type;
  }

  constructor(list: Tag[]) {
    this.value = list;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class CompoundTag {
  static readonly tag = 10;
  static readonly type = "compound";

  readonly name;
  readonly value;

  get type() {
    return CompoundTag.type;
  }

  constructor(name: string, compound: { [key: string]: Tag }) {
    this.name = name;
    this.value = compound;
  }

  toJSON() {
    return { name: this.name, type: this.type, value: this.value };
  }
}

export class IntArrayTag {
  static readonly tag = 11;
  static readonly type = "intArray";

  readonly value;

  get type() {
    return IntArrayTag.type;
  }

  constructor(intArray: Int32Array) {
    this.value = intArray;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}

export class LongArrayTag {
  static readonly tag = 12;
  static readonly type = "longArray";

  readonly value;

  get type() {
    return LongArrayTag.type;
  }

  constructor(longArray: BigInt64Array) {
    this.value = longArray;
  }

  toJSON() {
    return { type: this.type, value: this.value };
  }
}