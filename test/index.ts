import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const RIDICULOUS = new URL("./nbt/ridiculous.nbt",import.meta.url);
const EXTREME = new URL("./nbt/extreme.nbt",import.meta.url);

const buffer = await readFile(EXTREME);
console.log(buffer,"\n");

const result = await NBT.read(buffer);
console.log(result,"\n");

const recompile = await NBT.write(result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(buffer.subarray(10),recompile.subarray(10)));