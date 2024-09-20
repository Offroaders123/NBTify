type CustomInspectFunction = import("node:util").CustomInspectFunction;

const CustomInspect = Symbol.for("nodejs.util.inspect.custom");

export type Int8<T extends number = number> = T & {
  valueOf(): T;
  [Symbol.toPrimitive](): T;
  get [Symbol.toStringTag](): "Int8";
};

interface Int8Constructor extends NumberConstructor {
  new <T extends number = number>(value: T): Int8<T>;
  <T extends number = number>(value: T): Int8<T>;
  readonly prototype: Int8;
}

export const Int8 = function<T extends number>(value: T): Int8<T> {
  if (!new.target) {
    return new Int8(value);
  }
  const self = new Number(value << 24 >> 24);
  Object.setPrototypeOf(self, Int8.prototype);
  return self as Int8<T>;
} as Int8Constructor;

Object.setPrototypeOf(Int8.prototype, Number.prototype);
Object.setPrototypeOf(Int8, Number);

Int8.prototype[Symbol.toPrimitive] = function() {
  return this.valueOf();
};

Object.defineProperty(Int8.prototype, Symbol.toStringTag, {
  get() {
    return "Int8";
  },
  enumerable: false,
  configurable: true
});

Object.defineProperty(Int8.prototype, CustomInspect, {
  get(): CustomInspectFunction {
    return (_, { stylize }) => stylize(`${this.valueOf()}b`, "number");
  }
});

export class Int16<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
  }

  override valueOf(): T {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag](): "Int16" {
    return "Int16";
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_, { stylize }) => stylize(`${this.valueOf()}s`, "number");
  }
}

export class Int32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
  }

  override valueOf(): T {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag](): "Int32" {
    return "Int32";
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return () => this.valueOf();
  }
}

export class Float32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf(): T {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag](): "Float32" {
    return "Float32";
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_, { stylize }) => stylize(`${this.valueOf()}f`, "number");
  }
}