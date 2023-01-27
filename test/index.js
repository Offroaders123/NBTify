// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

// const data = await fs.readFile(new URL("./nbt/unnamed.nbt",import.meta.url));
// console.log(data,"\n");

// const result = await NBT.read(data);
const result = new NBT.NBTData({
  Noice: true,
  WorkOnBooleanValuesPls: true,
  AnotherProperty: "Bananrama!"
});
console.log(result,"\n");

const data = await NBT.write(result).then(Buffer.from);
console.log(data,"\n");

const stringed = NBT.stringify(result.data);
console.log(stringed,"\n");

const parsed = /** @type { NBT.CompoundTag } */
  (NBT.parse(stringed));
console.log(parsed,"\n");

// Using the base 'result' NBTData object as the WriteOptions
const recompile = await NBT.write(parsed,result); 
console.log(Buffer.from(recompile),"\n");

console.log(Buffer.compare(data,recompile));