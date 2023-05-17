import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

import type { LCEPlayer } from "./LCEPlayer.d.ts";

const PLAYER_FILE_0 = new URL("./nbt/P_280dfc7dac2f_00000001_knarF_520.dat",import.meta.url);
const PLAYER_FILE_1 = new URL("./nbt/N_280dfc7dac2f_100000001_.dat",import.meta.url);

const data = await readFile(PLAYER_FILE_0);
console.log(data,"\n");

const result = await NBT.read<LCEPlayer>(data,{ strict: false });
console.log(result,"\n");

console.log(result.data.SelectedItem.id,"\n");

const recompile = await NBT.write(result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(data,recompile));