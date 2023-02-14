// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

const { default: result } = await import("./nbt/stringy.js");
// console.log(result.data,"\n");

const data = await NBT.write(result).then(Buffer.from);
// console.log(data,"\n");

const stringed = NBT.stringify(result.data,2);
console.log(stringed,"\n");

const parsed = NBT.parse(stringed);
// console.log(parsed,"\n");

// Using the base 'result' NBTData object as the WriteOptions
const recompile = await NBT.write(parsed,result);
// console.log(Buffer.from(recompile),"\n");

console.log(Buffer.compare(data,recompile));