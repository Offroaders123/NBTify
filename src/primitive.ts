export class Byte<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int8Array([value]);
    super(result);
  }

  get [Symbol.toStringTag]() {
    return "Byte" as "Byte";
  }

  valueOf() {
    return super.valueOf() as T;
  }
}

export class Short<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int16Array([value]);
    super(result);
  }

  get [Symbol.toStringTag]() {
    return "Short" as "Short";
  }

  valueOf() {
    return super.valueOf() as T;
  }
}

export class Int<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int32Array([value]);
    super(result);
  }

  get [Symbol.toStringTag]() {
    return "Int" as "Int";
  }

  valueOf() {
    return super.valueOf() as T;
  }
}

export class Float<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Float32Array([value]);
    super(result);
  }

  get [Symbol.toStringTag]() {
    return "Float" as "Float";
  }

  valueOf() {
    return super.valueOf() as T;
  }
}