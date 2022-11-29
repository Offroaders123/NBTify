// @ts-check

import * as fs from "node:fs/promises";
import { write, NBTReader, NBTData, Byte, Int } from "../dist/index.js";

const base = new NBTData({
  Cheats: new Byte(0),
  GameMode: new Int(0),
  TimePlayed: 1235n
});
console.log(base);

const input = await write(base);
console.log(...input,"\n");

// fs.writeFile(new URL("./nbt/input.nbt",import.meta.url),input);

const output = await fs.readFile(new URL("./nbt/unnamed.nbt",import.meta.url));
console.log(...output);

const result = new NBTReader().read(output,{ named: false });
console.log(result,"\n");

const recompile = await write(result);
console.log(...recompile,"\n");

console.log(Buffer.compare(output,recompile));