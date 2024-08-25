import { readFile } from "node:fs/promises";
import { readString, writeString } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.snbt", import.meta.url);

const data = await readFile(bigtest);
console.log(data);

const result = readString(data.toString());
// console.log(result);

const stringy = writeString(result, { space: 2 });
console.log(stringy);