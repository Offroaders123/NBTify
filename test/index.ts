import { readFile } from "node:fs/promises";
import { inspect } from "node:util";
import { getTagType, parse, read, write } from "../src/index.js";

import type { NBTData } from "../src/index.js";

const bigtest = new URL("./nbt/bigtest.snbt", import.meta.url);

const data: Buffer = await write(parse(await readFile(bigtest, "utf-8"))).then(Buffer.from);
console.log(data);

const nbt: NBTData = await read(data, {},
    function(key, value) {
      if (key !== "") console.log(inspect(this, { colors: true, depth: 0 }), key, value);
      return value;
    });
// console.log(nbt);