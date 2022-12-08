// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

const data = await fs.readFile(new URL("./nbt/ridiculous.nbt",import.meta.url));
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const recompile = Buffer.from(await NBT.write(result));
console.log(recompile,"\n");

console.log(Buffer.compare(data,recompile));