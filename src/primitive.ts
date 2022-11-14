export class Byte extends Number {
  static readonly MIN_VALUE = -128;
  static readonly MAX_VALUE = 127;

  constructor(value?: any) {
    if (value < Byte.MIN_VALUE || value > Byte.MAX_VALUE){
      throw new RangeError(`Byte value must be between ${Byte.MIN_VALUE} and ${Byte.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Short extends Number {
  static readonly MIN_VALUE = -32768;
  static readonly MAX_VALUE = 32767;

  constructor(value?: any) {
    if (value < Short.MIN_VALUE || value > Short.MAX_VALUE){
      throw new RangeError(`Short value must be between ${Short.MIN_VALUE} and ${Short.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Int extends Number {
  static readonly MIN_VALUE = -2147483648;
  static readonly MAX_VALUE = 2147483647;

  constructor(value?: any) {
    if (value < Int.MIN_VALUE || value > Int.MAX_VALUE){
      throw new RangeError(`Int value must be between ${Int.MIN_VALUE} and ${Int.MAX_VALUE}`);
    }
    super(value);
  }
}

export class Float extends Number {
  static readonly MIN_VALUE = -3.4e+38;
  static readonly MAX_VALUE = 3.4e+38;

  constructor(value?: any) {
    if (value < Float.MIN_VALUE || value > Float.MAX_VALUE){
      throw new RangeError(`Float value must be between ${Float.MIN_VALUE} and ${Float.MAX_VALUE}`);
    }
    super(value);
  }
}