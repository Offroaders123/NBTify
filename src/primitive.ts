export class Byte<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int8Array([value]);
    super(result);
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

  valueOf() {
    return super.valueOf() as T;
  }
}

export class Int<T extends number = number> extends Number {
  constructor(value: T) {
    const [result] = new Int32Array([value]);
    super(result);
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

  valueOf() {
    return super.valueOf() as T;
  }
}