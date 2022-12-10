// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

const data = await fs.readFile(new URL("./nbt/level.dat",import.meta.url));
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const result2 = await NBT.write(result,{ name: "fart!", bedrockLevel: null })
.then(buffer => NBT.read(buffer,{ endian: "little" }));
console.log(result2,"\n");

const recompile = Buffer.from(await NBT.write(result2));
console.log(recompile,"\n");

console.log(Buffer.compare(data,recompile));