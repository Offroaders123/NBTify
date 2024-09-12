import { readFile, writeFile } from "node:fs/promises";
import { parse, read, write } from "../src/index.js";

const ridiculous = new URL("./nbt/ridiculous.snbt", import.meta.url);

const data = await readFile(ridiculous);
console.log(data);

const nbt = parse(data.toString());
console.log(nbt);

const result = await write(nbt, {
  rootName: null,
  endian: "little",
  compression: "deflate-raw",
  bedrockLevel: false
});

const differ = await read(result);
console.log(differ);

await writeFile(new URL(ridiculous.toString().replace(/.snbt$/, ".nbt")), result);