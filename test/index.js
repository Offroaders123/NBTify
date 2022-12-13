// @ts-check

import { Buffer } from "node:buffer";
import * as NBT from "../dist/index.js";

/** @type { NBT.CompoundTag } */
const value = {
  list: [
    "a str!",
    5,
    "prev mst b str"
  ]
};
console.log(value,"\n");

const result = Buffer.from(await NBT.write(value));
console.log(result,"\n");

const decompile = await NBT.read(result);
console.log(decompile);