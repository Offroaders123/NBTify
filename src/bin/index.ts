#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, snbt, pipe, name, endian, compression, bedrockLevel } from "./args.js";

import type { RootTagLike } from "../index.js";

// console.log({ name, endian, compression, bedrockLevel });

if (file === undefined){
  throw new TypeError("Missing argument 'input'");
}

const input = await readFile(file);

const data: RootTagLike | NBTData = extname(file) === ".snbt" ? parse(input.toString()) : await read(input);

const nbt: NBTData = new NBTData(data,{ name, endian, compression, bedrockLevel });
if (!pipe){
  console.log(snbt ? stringify(nbt,{ space: 2 }) : nbt);
}

if (pipe){
  const output = snbt ? stringify(nbt,{ space: 2 }) : await write(nbt);
  await new Promise(resolve => process.stdout.write(output,resolve));
}