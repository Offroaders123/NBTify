// @ts-check

import * as NBT from "../dist/index.js";

// @ts-ignore
delete window.SharedArrayBuffer;

const buffer = await fetch("./nbt/bigtest.nbt")
  .then(response => response.arrayBuffer());
console.log(buffer);

const result = await NBT.read(buffer);
console.log(result.data);

const { buffer: recompile } = await NBT.write(result);
console.log(recompile);