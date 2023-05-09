import type { inspect as inspectFn, InspectOptionsStylized } from "node:util";

export class Byte<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Byte" as const;
  }

  [Symbol.for("nodejs.util.inspect.custom")](_: number, { stylize }: InspectOptionsStylized) {
    return stylize(`${this.valueOf()}b`,"number");
  }
}

export class Short<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Short" as const;
  }

  [Symbol.for("nodejs.util.inspect.custom")](_: number, { stylize }: InspectOptionsStylized) {
    return stylize(`${this.valueOf()}s`,"number");
  }
}

export class Int<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int" as const;
  }

  [Symbol.for("nodejs.util.inspect.custom")](_: number, options: InspectOptionsStylized, inspect: typeof inspectFn) {
    return `Int { ${inspect(this.valueOf(),{ colors: true })} }`;
  }
}

export class Float<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Float" as const;
  }

  [Symbol.for("nodejs.util.inspect.custom")](_: number, { stylize }: InspectOptionsStylized) {
    return stylize(`${this.valueOf()}f`,"number");
  }
}