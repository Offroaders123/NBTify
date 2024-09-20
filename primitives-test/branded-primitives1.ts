export class Int8<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
  }

  override valueOf(): T {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag](): "Int8" {
    return "Int8";
  }
}

declare const __brand: unique symbol;

type Branded<T, Brand extends string> = T & { [__brand]: Brand; };

function makeInt8<T extends number = number>(value: T): ByteTag<T> {
  return new Int8(value) as ByteTag<T>;
}

const gg = new Int8<number>(5);

export type ByteTag<T extends number = number> = Branded<T, "Int8">;

let hey: ByteTag<5>;

hey = makeInt8(5);

// https://www.youtube.com/watch?v=Yz8ySbaeCf8