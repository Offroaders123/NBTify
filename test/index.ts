import { readFile, writeFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const RIDICULOUS = new URL("./nbt/ridiculous.nbt",import.meta.url);
const EXTREME = new URL("./nbt/extreme.nbt",import.meta.url);

const data = await readFile(RIDICULOUS);
console.log(data,"\n");

const result = await NBT.read(data);
console.log(result,"\n");

const recompile = await NBT.write(result,{ compression: "deflate-raw" }).then(Buffer.from);
console.log("Demo - compress\n",recompile,"\n");

const decompile = await NBT.decompress(recompile,"deflate-raw").then(Buffer.from);
console.log("Demo - decompress\n",decompile,"\n");

const rerecompile = await NBT.read(recompile,{ compression: "deflate-raw" })
  .then(result => NBT.write(result).then(Buffer.from));
console.log("Final result",rerecompile,"\n");

console.log(Buffer.compare(recompile,rerecompile));

// await writeFile(EXTREME,rerecompile);