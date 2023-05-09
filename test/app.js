// @ts-check

import * as NBT from "../dist/index.js";

// @ts-expect-error
delete window.SharedArrayBuffer;

const buffer = await fetch("./nbt/bigtest.nbt")
  .then(response => response.arrayBuffer());
console.log(buffer);

const result = await NBT.read(buffer);
console.log(result);

const { buffer: recompile } = await NBT.write(result);
console.log(recompile);