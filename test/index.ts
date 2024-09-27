import { readFile } from "node:fs/promises";
import { Int8, read } from "../src/index.js";
import { rejects } from "node:assert";

const helloWorld = new URL("./nbt/hello_world.nbt", import.meta.url);

const data = await readFile(helloWorld);
console.log(data);

const nbt0 = await read(data);
console.log(nbt0);

console.log(Int8.MAX_SAFE_INTEGER);
console.log(Number.MAX_SAFE_INTEGER);

const byte0 = new Int8() satisfies number;
    // ^?

const byte1 = new Int8(1) satisfies number;
    // ^?

byte0; byte1;

await rejects(async () => {
  const nbt1 = await read(data, { rootName: "SHOULD_ERROR" });
  console.log(nbt1);
});