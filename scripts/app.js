// ES Module imports
import * as nbt from "./nbt-parser/index.js";

window.nbt = nbt;

// Fetch NBT data
const BEDROCK_NBT = await (await fetch("./nbt/level.dat")).arrayBuffer();
const JAVA_NBT = await (await fetch("./nbt/simple_house.nbt")).arrayBuffer();

window.BEDROCK_NBT = BEDROCK_NBT;
window.JAVA_NBT = JAVA_NBT;

// Working with the NBT data
console.log(nbt.parse(JAVA_NBT));

const CUSTOM_DATA = nbt.write({
  name: "hey",
  value: {
    hey: {
      type: "int",
      value: 42
    }
  }
});

console.log(CUSTOM_DATA);

console.log(nbt.parse(CUSTOM_DATA));