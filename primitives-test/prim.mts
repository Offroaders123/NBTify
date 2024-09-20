export type Int8<T extends number = number> = T & {
  valueOf(): T;
  get [Symbol.toStringTag](): "Int8";
};

export interface Int8Constructor extends NumberConstructor {
  <T extends number = number>(value: T): Int8<T>;
  new <T extends number = number>(value: T): Int8<T>;
  readonly prototype: Int8;
}