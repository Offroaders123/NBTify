import { readFile } from "node:fs/promises";
import { Int32, read, write } from "../src/index.js";

const path = new URL("./nbt/hello_world.nbt",import.meta.url);
const buffer: Buffer = await readFile(path);

const nbt = await read<any>(buffer);
console.log(nbt);
nbt.data.StorageVersion = new Int32(8);

const sameThang = nbt; // new NBTData(nbt,{ endian: "little", bedrockLevel: true });
// @ts-expect-error
sameThang.endian = "🌭";
sameThang.endian = "little";
sameThang.bedrockLevel = true;
console.log(sameThang);

const result = await write(sameThang);
console.log(result);