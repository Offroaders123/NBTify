import { readFile } from "node:fs/promises";
import { Int32, NBTData, read, write } from "../src/index.js";

const path = new URL("./nbt/hello_world.nbt",import.meta.url);
const buffer: Buffer = await readFile(path);

const nbt = await read<any>(buffer);
console.log(nbt);
nbt.data.StorageVersion = new Int32(8);

const newThang = new NBTData(nbt,{ endian: "little", bedrockLevel: true });
console.log(newThang);

const result = await write(newThang);
console.log(result);