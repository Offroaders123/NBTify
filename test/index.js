// @ts-check

import { Buffer } from "node:buffer";
import * as NBT from "../dist/index.js";

/** @type { NBT.CompoundTag } */
const value = {
  IsNotAThing: true,
  IsAThing: false
};
console.log(value,"\n");

const result = Buffer.from(await NBT.write(value,{ name: null, endian: "big" }));
console.log(result,"\n");

const decompile = await NBT.read(result);
console.log(decompile.data);