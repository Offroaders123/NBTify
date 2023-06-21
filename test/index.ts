import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const file = new URL("./nbt/list-root.nbt",import.meta.url);

const buffer = await readFile(file);
console.log(buffer,"\n");

const result = await NBT.read(buffer);
console.log(result,"\n");

const stringified = NBT.stringify(result,{ space: 2 });
console.log(stringified,"\n");

const parsed = NBT.parse(stringified);
console.log(parsed,"\n");

const recompile = await NBT.write(parsed,result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(buffer,recompile));