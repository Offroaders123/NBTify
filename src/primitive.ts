export class Byte extends Number {
  constructor(value?: any) {
    const [result] = new Int8Array([value]);
    super(result);
  }
}

export class Short extends Number {
  constructor(value?: any) {
    const [result] = new Int16Array([value]);
    super(result);
  }
}

export class Int extends Number {
  constructor(value?: any) {
    const [result] = new Int32Array([value]);
    super(result);
  }
}

export class Float extends Number {
  constructor(value?: any) {
    const [result] = new Float32Array([value]);
    super(result);
  }
}