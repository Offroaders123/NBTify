import * as NBT from "../src/index.js";
import gg from "./invalid.js";

console.log(gg.data,"\n");

const buf = await NBT.write(gg);
console.log(Buffer.from(buf),"\n");

const gghe = await NBT.read(buf);
console.log(gghe.data,"\n");

const oogha = NBT.stringify(gg,{ space: 2 });
console.log(oogha,"\n");

const oioh = NBT.stringify(gghe,{ space: 2 });
console.log(oioh,"\n");

const aeugh = NBT.parse(oioh);
console.log(aeugh,"\n");

const bug = await NBT.write(aeugh);
console.log(Buffer.from(bug),"\n");

console.log(Buffer.compare(buf,bug),oogha === oioh,"\n");
console.log("(Looks like the SNBT strings aren't symmetrical, but only because of the 'true' to '1b' type conversion for 'CompoundTag.ThisIsAnotherCompoundTag')");