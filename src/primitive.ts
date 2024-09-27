type CustomInspectFunction = import("node:util").CustomInspectFunction;

const CustomInspect = Symbol.for("nodejs.util.inspect.custom");

type NonConstructorKeys<T> = { [P in keyof T]: T[P] extends new () => any ? never : P; }[keyof T];
type NonConstructor<T> = Pick<T, NonConstructorKeys<T>>;

type NumberConstructor = NonConstructor<globalThis.NumberConstructor>;

export type Int8<T extends number = number> = T & {
  readonly [Symbol.toStringTag]: "Int8";
};

interface Int8Constructor extends NumberConstructor {
  new <T extends number = number>(value: T): Int8<T>;
  readonly prototype: Int8;
}

export const Int8 = class Int8<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
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
} as Int8Constructor;

export type Int16<T extends number = number> = T & {
  readonly [Symbol.toStringTag]: "Int16";
};

interface Int16Constructor extends NumberConstructor {
  new <T extends number = number>(value: T): Int16<T>;
  readonly prototype: Int16;
}

export const Int16 = class Int16<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
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
} as Int16Constructor;

export type Int32<T extends number = number> = T & {
  readonly [Symbol.toStringTag]: "Int32";
};

interface Int32Constructor extends NumberConstructor {
  new <T extends number = number>(value: T): Int32<T>;
  readonly prototype: Int32;
}

export const Int32 = class Int32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
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
} as Int32Constructor;

export type Float32<T extends number = number> = T & {
  readonly [Symbol.toStringTag]: "Float32";
};

interface Float32Constructor extends NumberConstructor {
  new <T extends number = number>(value: T): Float32<T>;
  readonly prototype: Float32;
}

export const Float32 = class Float32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
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
} as Float32Constructor;