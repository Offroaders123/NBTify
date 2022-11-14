export class Byte extends Number {
  constructor(value?: any) {
    super(new Int8Array([value])[0]);
  }
}

export class Short extends Number {
  constructor(value?: any) {
    super(new Int16Array([value])[0]);
  }
}

export class Int extends Number {
  constructor(value?: any) {
    super(new Int32Array([value])[0]);
  }
}

export class Float extends Number {
  constructor(value?: any) {
    super(new Float32Array([value])[0]);
  }
}