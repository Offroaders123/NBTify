// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "./dist/index.js";

const data = await fs.readFile("../nbtest/nbt/bigtest.nbt").then(NBT.decompress);
// console.log(...data);

const reader = new NBT.Reader();

const result = reader.read(data);
result.delete("byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))");
console.log(result);

// const stringed = JSON.stringify(result);
// console.log(stringed);

console.log(JSON.stringify(result,null,2));

// const cosa = new NBT.LongTag(128n);
// // cosa.value = "THIS IS WRONG :OO";
// console.log(cosa,cosa.valueOf());

// const mojang = new NBT.CompoundTag({ [NBT.CompoundTag.ROOT_NAME]: "mojaaaang! :D", 5: true });
// mojang.set("noice",new NBT.LongTag(10));
// console.log(mojang);