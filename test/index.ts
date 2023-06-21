import * as NBT from "../src/index.js";

const result = new NBT.NBTData([true,false]);
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

// This should error
console.log(NBT.parse("[B;0b,1b,2b,3b,4b,5b,6b,7b,8b,9b]"));