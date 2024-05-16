import { readFile } from "node:fs/promises";
import { parse, stringify } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.snbt", import.meta.url);

const data = await readFile(bigtest);
console.log(data);

const result = parse(data.toString());
// console.log(result);

const stringy = stringify(result, { space: 2 });
console.log(stringy);