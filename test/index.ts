import { readFile } from "node:fs/promises";
import { getTagType, read } from "../src/index.js";

import type { NBTData } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.nbt", import.meta.url);

const data: Buffer = await readFile(bigtest);
console.log(data);

const nbt: NBTData = await read(data, {},
    function(key, value) {
      if (!("id" in this) && key !== "" && getTagType(value) === 1) console.log(this, key, value);
      return value;
    });
// console.log(nbt);