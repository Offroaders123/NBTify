import * as NBT from "../src/index.js";

const BIGTEST = new URL("https://raw.github.com/Dav1dde/nbd/master/test/bigtest.nbt");

const data = await fetch(BIGTEST);
// console.log(data,"\n");

const result = await NBT.readNBT(data.body!);
console.log(result,"\n");