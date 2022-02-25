// ES Module imports
import * as nbt from "./nbt-parser.js";

// Fetch NBT data
const BEDROCK_NBT = await (await fetch("../nbt/level.dat")).arrayBuffer();
const JAVA_NBT = await (await fetch("../nbt/hello_world.nbt")).arrayBuffer();

window.BEDROCK_DAT = BEDROCK_NBT;
window.JAVA_NBT = JAVA_NBT;

// Working with the NBT data
nbt.parse(JAVA_NBT,(error,data) => {
  if (error) throw error;
  console.log(data);
});