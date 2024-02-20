#!/usr/bin/env node

import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, nbt, snbt, format, space } from "./args.js";

import type { RootTag } from "../index.js";

if (file === undefined){
  file satisfies never;
  throw new TypeError("Missing argument 'input'");
}

const buffer: Buffer = readFileSync(file);

let input: RootTag | NBTData;

if (file === 0){
  try {
    input = parse(buffer.toString());
  } catch {
    input = await read(buffer);
  }
} else {
  input = extname(file) === ".snbt"
    ? parse(buffer.toString())
    : await read(buffer);
}

const output: NBTData = new NBTData(input,format);

if (!nbt && !snbt){
  console.log(inspect(output,{ colors: true, depth: null }));
  process.exit(0);
}

const stdoutWriteAsync = promisify(process.stdout.write.bind(process.stdout));

const result: string | Uint8Array = snbt
  ? `${stringify(output,{ space: space ?? 2 })}\n`
  : await write(output);
await stdoutWriteAsync(result);