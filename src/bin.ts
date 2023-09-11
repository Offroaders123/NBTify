#!/usr/bin/env node

import { argv } from "node:process";
import { readFile } from "node:fs/promises";
import { read } from "./read.js";

export type Args = [string];

const args = argv.slice(2) as Args;
console.log(args);

const [file] = args;

const { buffer } = await readFile(file);
const nbt = await read(buffer);
console.log(nbt);