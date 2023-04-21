export class Byte<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int8Array([value]);
    super(result);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Byte" as const;
  }
}

export class Short<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int16Array([value]);
    super(result);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Short" as const;
  }
}

export class Int<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int32Array([value]);
    super(result);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int" as const;
  }
}

export class Float<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Float32Array([value]);
    super(result);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Float" as const;
  }
}