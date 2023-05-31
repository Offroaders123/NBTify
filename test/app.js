// @ts-check

import * as NBT from "../dist/index.js";

const PLAYER_FILE_0 = new URL("./nbt/P_280dfc7dac2f_00000001_knarF_520.dat",import.meta.url);
const PLAYER_FILE_1 = new URL("./nbt/N_280dfc7dac2f_100000001_.dat",import.meta.url);

const buffer = await fetch(PLAYER_FILE_0)
  .then(response => response.arrayBuffer())
  .then(buffer => new Uint8Array(buffer));
console.log(buffer);

const result = await NBT.read(buffer,{ strict: false });
console.log(result);

const recompile = await NBT.write(result);
console.log(recompile);