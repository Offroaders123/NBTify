import * as NBT from "../src/index.js";

declare const noice: Uint8Array;
const nbt = await NBT.read(noice);

type ImplicitType = typeof nbt.data;

const result = new NBT.NBTData(
  new NBT.ListTag<NBT.BooleanTag>(
    new NBT.BooleanTag(true),
    new NBT.BooleanTag(false)
  )
);
console.log(result,"\n");

const buffer = await NBT.write(result).then(Buffer.from);
console.log(buffer,"\n");

const stringified = NBT.stringify(result);
console.log(stringified,"\n");

const parsed = NBT.parse(stringified);
console.log(parsed,"\n");

const recompile = await NBT.write(parsed,result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(buffer,recompile),"\n");

// ~~This should error~~ 👍
const byteArray = NBT.parse("[B;0b,1b,2b,3b,4b,5b,6b,7b,8b,9b]");
console.log(byteArray);

const stringed = NBT.stringify(byteArray);
console.log(stringed);