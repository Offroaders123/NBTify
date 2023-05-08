import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const LEVEL_DAT = new URL("./nbt/level.dat",import.meta.url);

const data = await readFile(LEVEL_DAT);
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const stringified = NBT.definition(result,{ name: "BedrockLevel" });
console.log(stringified);