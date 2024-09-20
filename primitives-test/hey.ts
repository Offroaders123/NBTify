import { Int8 } from "../src/index.js";

console.log(Int8);

const num = 5;
console.log(num);

const byte0 = Int8(num);
console.log(byte0);
const byte1 = new Int8(num);
console.log(byte1);

const gg: number = byte0 + byte1;
console.log(gg, `'gg' is number: ${typeof gg === "number"}`);

byte0 satisfies number;
byte1 satisfies number;

const broader: number = byte0;
console.log(broader);

const specific: 5 = byte0.valueOf() satisfies 5;