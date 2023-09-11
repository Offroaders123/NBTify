#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { read, parse, stringify } from "./index.js";

process.on("uncaughtException",event => {
  console.error(`${event}`);
  process.exit(1);
});

const args = process.argv.slice(2);
// console.log(args);

const [file] = args;

const snbt = args.some(arg => arg === "--snbt");

if (file === undefined){
  throw new Error("Missing argument 'input'");
}

const buffer = await readFile(file);

const nbt = extname(file) === ".snbt" ? parse(buffer.toString()) : await read(buffer);
console.log(snbt ? stringify(nbt,{ space: 2 }) : nbt);