// @ts-check

import { Buffer } from "node:buffer";
import * as NBT from "../dist/index.js";

/** @type { NBT.CompoundTag } */
const value = {
  IsFancy: new NBT.Byte(0),
  Noice: new Int8Array([55,32,4,125,8,99,57,4])
};
console.log(value,"\n");

/** @type { NBT.WriteOptions } */
const options = { name: null, endian: "little" };
console.log(options,"\n");

const data = new NBT.NBTData(value,options);
// console.log(data,"\n");

const writer = new NBT.NBTWriter();

const result = Buffer.from(writer.write(data));
console.log(result,"\n");

const result2 = Buffer.from(await NBT.write(value,options));
console.log(result2,"\n");

console.log(Buffer.compare(result,result2));