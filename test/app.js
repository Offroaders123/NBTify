// @ts-check

import * as NBT from "../dist/index.js";

globalThis.NBT = NBT;

const buffer = await fetch("./nbt/bigtest.nbt").then(response => response.arrayBuffer());
const data = await NBT.decompress(new Uint8Array(buffer));
console.log(...data);

const reader = new NBT.Reader();

const result = reader.read(data);
// result.delete("byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))");
console.log(result);

console.log(JSON.stringify(result,null,2));