#!/usr/bin/env node

import { argv } from "node:process";
import { readFile } from "node:fs/promises";
import { read, parse } from "./index.js";

const args = argv.slice(2);
console.log(args);

const [file] = args;

if (file === undefined){
  console.error("Missing argument 'input'.");
  process.exit(1);
}

const buffer = await readFile(file).catch(error => {
  console.error(`${error}`);
  process.exit(1);
});

try {
  const snbt = parse(buffer.toString());
  console.log(snbt);
} catch {
  const nbt = await read(buffer);
  console.log(nbt);
}