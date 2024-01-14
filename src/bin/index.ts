#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, snbt, nbt } from "./args.js";

import type { Format, RootTag } from "../index.js";

(async () => {

if (file === undefined){
  file satisfies never;
  throw new TypeError("Missing argument 'input'");
}

const format: Format = {
  rootName: "",
  endian: "little",
  compression: null,
  bedrockLevel: null
};

const input = await readFile(file);
const data: RootTag | NBTData = extname(file) === ".snbt" ? parse(input.toString()) : await read(input,format);

if (!nbt){
  console.log(snbt ? stringify(data,{ space: 2 }) : data);
} else {
  const output: string | Uint8Array = snbt ? stringify(data,{ space: 2 }) : await write(data,format);
  await new Promise<Error | undefined>(resolve => process.stdout.write(output,resolve));
}

})();