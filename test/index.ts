import { readFile, writeFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const RIDICULOUS = new URL("./nbt/ridiculous.nbt",import.meta.url);

const data = await readFile(RIDICULOUS);
// console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

// const stringed = NBT.stringify(result,{ space: 2 });
// console.log(stringed,"\n");

// const parsed = NBT.parse(stringed);
// console.log(parsed,"\n");

const recompile = await NBT.write(result,{ compression: "deflate-raw" }).then(Buffer.from);
console.log(recompile,"\n");

const decompile = await NBT.decompress(recompile,"deflate-raw");
console.log(decompile);

console.log(Buffer.compare(data.subarray(10),recompile.subarray(10)));