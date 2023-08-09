import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const file = new URL("./nbt/bigtest.snbt",import.meta.url);

const snbt = await readFile(file,{ encoding: "utf-8" });
console.log(snbt);

const nbt = NBT.parse(snbt);
console.log(nbt);

const restring = NBT.stringify(nbt,{ space: 2 });
console.log(restring);

console.log(snbt === restring);