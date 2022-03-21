// ES Module imports
//import * as nbt from "../../index.js";

//window.nbt = nbt;

// Fetch NBT data
const BEDROCK_NBT = await (await fetch("./nbt/level.dat")).arrayBuffer();
const JAVA_NBT = await (await fetch("./nbt/hello_world.nbt")).arrayBuffer();

window.BEDROCK_NBT = BEDROCK_NBT;
window.JAVA_NBT = JAVA_NBT;

// Working with the NBT data
console.log(BEDROCK_NBT);
console.log(JAVA_NBT);

const BEDROCK_OUTPUT = nbt.parse(BEDROCK_NBT,{ endian: "little" });
const JAVA_OUTPUT = nbt.parse(JAVA_NBT);

console.log(BEDROCK_OUTPUT);
console.log(JAVA_OUTPUT);

const BEDROCK_RECOMPILE = nbt.write(BEDROCK_OUTPUT,{ endian: "little" });
const JAVA_RECOMPILE = nbt.write(JAVA_OUTPUT,{ gzip: false });

console.log(BEDROCK_RECOMPILE);
console.log(JAVA_RECOMPILE);