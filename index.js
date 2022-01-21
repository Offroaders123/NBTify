/* Testing script to compare my project with Prismarine-NBT's results */
const { readFileSync, writeFileSync } = require("fs"), { parse } = require("prismarine-nbt");

let level = readFileSync("level.dat");
let data = parse(level,(error,data) => {
  writeFileSync("level.dat.json",JSON.stringify(data,null,"  "));
});