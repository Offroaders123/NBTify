import { readFile } from "node:fs/promises";
import { inspect } from "node:util";
import { getTagType, parse } from "../src/index.js";

import type { NBTData } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.snbt", import.meta.url);

const data0: Buffer = await readFile(bigtest);
console.log(data0);
const data: string = data0.toString("utf-8");

const nbt: NBTData = parse(data,
    function(key, value) {
      if (key !== "" && [7, 9, 11, 12].includes(getTagType(this)!)) console.log(inspect(this, { colors: true, depth: 0 }), key, value);
      return value;
    });
// console.log(nbt);