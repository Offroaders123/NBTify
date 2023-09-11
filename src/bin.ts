#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, parse } from "./index.js";

process.on("uncaughtException",event => {
  console.error(`${event}`);
  process.exit(1);
});

const args = process.argv.slice(2);
// console.log(args);

const [file] = args;

if (file === undefined){
  throw new Error("Missing argument 'input'");
}

const buffer = await readFile(file);

if (extname(file) === ".snbt"){
  const snbt = parse(buffer.toString());
  console.log(snbt);
} else {
  const nbt = await read(buffer);
  console.log(nbt);
}