import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

interface Ridiculous {
  IsRidiculous: NBT.BooleanTag;
  Bugrock: NBT.IntTag;
  Noice: NBT.ByteArrayTag;
}

interface RidiculousFormat extends NBT.FormatOptions {
  name: null;
  endian: "little";
  compression: "gzip";
  bedrockLevel: NBT.IntTag<8>;
}

const RIDICULOUS = new URL("./nbt/ridiculous.nbt",import.meta.url);

const buffer = await readFile(RIDICULOUS);
console.log(buffer,"\n");

const result = await NBT.read<Ridiculous,RidiculousFormat>(buffer);
console.log(result,"\n");

const { data, name, endian, compression, bedrockLevel } = result;

// For the demo's purposes, hover over them to see their types! :D
data.IsRidiculous;
data.Bugrock;
data.Noice;
name;
endian;
compression;
bedrockLevel;

const recompile = await NBT.write(result).then(Buffer.from);
console.log(recompile,"\n");

console.log(Buffer.compare(buffer.subarray(10),recompile.subarray(10)));