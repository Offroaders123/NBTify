declare const __brand: unique symbol;

export type Branded<T, Brand> = T & { [__brand]: Brand; };

export type Int8<T extends number = number> = Branded<T, "Int8">;

function Int8<T extends number = number>(value: T): Int8<T> {
  return value;
}

Int8.prototype = Object.create(Number.prototype);

new Number(5) satisfies number;

type gg = {
  [K in keyof number]: number[K];
};

type aa = {
  [K in keyof Number]: Number[K];
};

5 satisfies gg;
5 satisfies aa;
new Number(5) satisfies gg;
new Number(5) satisfies aa;

// https://www.youtube.com/watch?v=Yz8ySbaeCf8
// https://medium.com/@apalshah/javascript-class-difference-between-es5-and-es6-classes-a37b6c90c7f8