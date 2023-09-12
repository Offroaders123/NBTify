#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, write, parse, stringify, NBTData } from "../index.js";

import type { RootTagLike, Name, Endian, Compression, BedrockLevel } from "../index.js";

process.on("uncaughtException",error => {
  console.error(`${error}`);
  process.exit(1);
});

const args = process.argv.slice(2);
// console.log(args);

const [file] = args;

const snbt = args.some(arg => arg === "--snbt");
const pipe = args.some(arg => arg === "--pipe");
const name = args.find(arg => arg.startsWith("--name="))?.slice(7) as Name | undefined;
const endian = args.find(arg => arg.startsWith("--endian="))?.slice(9) as Endian | undefined;
const compression = args.find(arg => arg.startsWith("--compression="))?.slice(14) as Compression | undefined;
const bedrockLevel = args.find(arg => arg.startsWith("--bedrock-level="))?.slice(16) as BedrockLevel | undefined;

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