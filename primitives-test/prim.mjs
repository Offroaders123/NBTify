// @ts-check

var CustomInspect = Symbol.for("nodejs.util.inspect.custom");

var Int8 = /** @type {import("./prim.mts").Int8Constructor} */ (function Int8(value) {
  if (!new.target) {
    return new /** @type {typeof Number} */ (Int8)(value);
  }

  const number = new Number(value << 24 >> 24);
  Object.setPrototypeOf(number, new.target.prototype);
  return number;
});

Object.setPrototypeOf(Int8.prototype, Number.prototype);
Object.setPrototypeOf(Int8, Number);

Object.defineProperty(Int8.prototype, Symbol.toStringTag, {
  get() {
    return "Int8";
  },
  enumerable: false,
  configurable: true
});

Object.defineProperty(Int8.prototype, CustomInspect, {
  get() {
    return (_, { stylize }) => stylize(`${this.valueOf()}b`, "number");
  }
});

console.log(Int8);
console.log(Int8.prototype);

console.log(Int8(5));

/** @type {import("./prim.mts").Int8<5>} */
const byte = Int8(5);
console.log(byte);

// Very awesome! Now you can use math with the object classes, at the type level!
// This is already 'safe' at the JS level because you can do this with `Number` objects
// already, and this wrapper extends that, hence why it works out of the box too.
/** @type {5} */
const hey = byte;
console.log(hey);

const gg = hey + 2 + byte; // yay!!!
console.log(gg);

console.log(typeof byte === "number");
console.log(typeof byte === "object");

// @ts-expect-error - this is typed as a number now, so it doesn't
// want to let you use it as an object
console.log(byte instanceof Int8);

// https://esdiscuss.org/topic/extending-an-es6-class-using-es5-syntax