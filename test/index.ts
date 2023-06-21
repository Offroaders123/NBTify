// import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const myList: NBT.ListTag<NBT.CompoundTag> = [
  {
    Noice: true,
    AnotherEntry: new NBT.Int8(5)
  },
  {
    IntThing: 251,
    ByteAraaay: new Int8Array([25,46,57,58,58,34,89,24,-22,-88])
  }
];

const content = new NBT.NBTData(myList,{ endian: "little" });
console.log(content,"\n");

const buffer = await NBT.write(content).then(Buffer.from);
console.log(buffer,"\n");

const decompile = await NBT.read(buffer);
console.log(decompile,"\n");

// const RIDICULOUS = new URL("./nbt/ridiculous.nbt",import.meta.url);
// const EXTREME = new URL("./nbt/extreme.nbt",import.meta.url);

// const buffer = await readFile(EXTREME);
// console.log(buffer,"\n");

// const result = await NBT.read(buffer);
// console.log(result,"\n");

// const recompile = await NBT.write(result).then(Buffer.from);
// console.log(recompile,"\n");

// console.log(Buffer.compare(buffer.subarray(10),recompile.subarray(10)));