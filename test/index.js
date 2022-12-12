// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

const data = await fs.readFile(new URL("./nbt/level.dat",import.meta.url));
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const { LevelName, hasBeenLoadedInCreative } = result.data;

console.log(LevelName);
console.log(hasBeenLoadedInCreative,"\n");

result.data.LevelName = "Custom World Name!";
result.data.hasBeenLoadedInCreative = new NBT.Byte(0);

const recompile = Buffer.from(await NBT.write(result));
console.log(recompile,"\n");

console.log(Buffer.compare(data,recompile));