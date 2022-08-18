// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "./dist/index.js";

const data = await fs.readFile("../nbtest/nbt/bigtest.nbt").then(NBT.decompress);
// console.log(...data);

const reader = new NBT.Reader();

const result = reader.read(data);
console.log(result);

// console.log(JSON.stringify(result,null,2));

// const cosa = new NBT.ListTag(new NBT.ByteTag(10));
// console.log(cosa);