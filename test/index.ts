import { readFile } from "node:fs/promises";
import { inspect } from "node:util";
import { getTagType, read } from "../src/index.js";

import type { NBTData } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.nbt", import.meta.url);

const data: Buffer = await readFile(bigtest);
console.log(data);

const nbt: NBTData = await read(data, {},
    function(key, value) {
      if (key !== "") console.log(inspect(this, { colors: true, depth: 0 }), key, value);
      return value;
    });
// console.log(nbt);