import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

import type { LCEPlayer } from "./LCEPlayer.d.ts";

const PLAYER_FILE_0 = new URL("./nbt/P_280dfc7dac2f_00000001_knarF_520.dat",import.meta.url);
const PLAYER_FILE_1 = new URL("./nbt/N_280dfc7dac2f_100000001_.dat",import.meta.url);

const data = await readFile(PLAYER_FILE_0);
console.log(data,"\n");

const result = await NBT.read<LCEPlayer>(data,{ strict: false });
console.log(result,"\n");

const recompile = await NBT.write(result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(data,recompile));

interface TempTest {
  noice: NBT.BooleanTag;
}

const { data: tempTest } = new NBT.NBTData<TempTest>({
  noice: true
});

tempTest.noice
// @ts-expect-error
tempTest.notAProperty

const demo = new NBT.NBTData({ nice: true, smartTypes: 10 });

demo.data.smartTypes;

interface MyData { Version: boolean; }
declare const heya: NBT.NBTData<MyData>;
const noice = new NBT.NBTData(heya);

const noice2 = await NBT.read(new Uint8Array(),heya);
const noice3 = new NBT.NBTReader().read(new Uint8Array(),heya);