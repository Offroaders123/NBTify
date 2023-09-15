#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, snbt, pipe, name, endian, compression, bedrockLevel } from "./args.js";

import type { RootTag } from "../index.js";

if (file === undefined){
  throw new TypeError("Missing argument 'input'");
}

const input = await readFile(file);
const data: RootTag | NBTData = extname(file) === ".snbt" ? parse(input.toString()) : await read(input);
const nbt: NBTData = new NBTData(data,{ name, endian, compression, bedrockLevel });

if (!pipe){
  console.log(snbt ? stringify(nbt,{ space: 2 }) : nbt);
} else {
  const output: string | Uint8Array = snbt ? stringify(nbt,{ space: 2 }) : await write(nbt);
  await new Promise<Error | undefined>(resolve => process.stdout.write(output,resolve));
}