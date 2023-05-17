import * as NBT from "../src/index.js";

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