import { readFile, writeFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const file = new URL("./nbt/bigtest.nbt",import.meta.url);

const nbt = await readFile(file).then(NBT.read);
console.log(nbt);

nbt.data.byteArrayTest = nbt.data["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"].slice(0,5);
delete nbt.data["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"];

nbt.data.intArrayTest = new Int32Array([543,123,7567,244]);
nbt.data.longArrayTest = new BigInt64Array([7676n,53534n,34534n,345345345n]);

nbt.data.escapedString = '"noice, I gotchya"';
nbt.data.escapeSequences = "\b\f\n\r\t\"\\";

const snbt = NBT.stringify(nbt,{ space: 2 });
console.log(snbt);

await writeFile(new URL(file.href.replace(".nbt",".snbt")),snbt);