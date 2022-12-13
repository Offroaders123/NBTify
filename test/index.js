// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

const data = await fs.readFile(new URL("./nbt/unnamed.nbt",import.meta.url))
console.log(data.buffer,"\n");

const result = await NBT.read(data.buffer);
console.log(result,"\n");

const recompile = await NBT.write(result);
console.log(recompile.buffer,"\n");

console.log(Buffer.compare(data,recompile));