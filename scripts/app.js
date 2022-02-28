// ES Module imports
import * as nbt from "./nbt-parser/index.js";

window.nbt = nbt;

// Fetch NBT data
const BEDROCK_NBT = await (await fetch("../nbt/level.dat")).arrayBuffer();
const JAVA_NBT = await (await fetch("../nbt/simple_house.nbt")).arrayBuffer();

window.BEDROCK_DAT = BEDROCK_NBT;
window.JAVA_NBT = JAVA_NBT;

// Working with the NBT data
nbt.parse(JAVA_NBT,(error,data) => {
  if (error) throw error;
  console.log(data);
});

const CUSTOM_DATA = nbt.writeUncompressed({
  name: "hey",
  value: {
    hey: {
      type: "int",
      value: 42
    }
  }
});

console.log(CUSTOM_DATA);

nbt.parse(CUSTOM_DATA,(error,data) => {
  if (error) throw error;
  console.log(data);
});