// ES Module imports
import { promises as fs } from "fs";
import * as nbt from "../../index.js";

// Fetch NBT data
const BEDROCK_NBT = await fs.readFile("../nbt/level.dat");
const JAVA_NBT = await fs.readFile("../nbt/hello_world.nbt");

// Working with the NBT data
console.log(BEDROCK_NBT);
console.log(JAVA_NBT);

const BEDROCK_OUTPUT = await nbt.parse(BEDROCK_NBT,{ endian: "little" });
const JAVA_OUTPUT = await nbt.parse(JAVA_NBT);

console.log(BEDROCK_OUTPUT);
console.log(JAVA_OUTPUT);

const BEDROCK_RECOMPILE = Buffer.from(await nbt.write(BEDROCK_OUTPUT,{ endian: "little" }));
const JAVA_RECOMPILE = Buffer.from(await nbt.write(JAVA_OUTPUT,{ gzip: false }));

console.log(BEDROCK_RECOMPILE);
console.log(JAVA_RECOMPILE);