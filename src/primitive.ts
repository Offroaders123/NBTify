import type { CustomInspectFunction } from "./global.d.ts";

const NodeInspect = Symbol.for("nodejs.util.inspect.custom");

export class Byte<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  [NodeInspect]: CustomInspectFunction = (_,{ stylize }) => {
    return stylize(`${this.valueOf()}b`,"number");
  }

  get [Symbol.toStringTag]() {
    return "Byte" as const;
  }
}

export class Short<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  [NodeInspect]: CustomInspectFunction = (_,{ stylize }) => {
    return stylize(`${this.valueOf()}s`,"number");
  }

  get [Symbol.toStringTag]() {
    return "Short" as const;
  }
}

export class Int<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  [NodeInspect]: CustomInspectFunction = () => {
    return this.valueOf();
  }

  get [Symbol.toStringTag]() {
    return "Int" as const;
  }
}

export class Float<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  [NodeInspect]: CustomInspectFunction = (_,{ stylize }) => {
    return stylize(`${this.valueOf()}f`,"number");
  }

  get [Symbol.toStringTag]() {
    return "Float" as const;
  }
}