// @ts-check

import * as NBT from "../dist/index.js";

globalThis.NBT = NBT;

const buffer = await fetch("./nbt/bigtest.nbt").then(response => response.arrayBuffer());
const data = new Uint8Array(buffer);
console.log(data);

const result = await NBT.read(data);
console.log(result);

const recompile = await NBT.write(result);
console.log(recompile);