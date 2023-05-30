import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const RIDICULOUS = new URL("./nbt/bigtest.nbt",import.meta.url);

const data = await readFile(RIDICULOUS);
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const stringed = NBT.stringify(result.data,{ pretty: true });
console.log(stringed,"\n");

const parsed = NBT.parse(stringed);
console.log(parsed,"\n");

const recompile = await NBT.write(parsed,result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(data.subarray(10),recompile.subarray(10)));