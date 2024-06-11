type CustomInspectFunction = import("node:util").CustomInspectFunction;

const CustomInspect = Symbol.for("nodejs.util.inspect.custom");

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

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_, { stylize }) => stylize(`${this.valueOf()}b`, "number");
  }
}

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