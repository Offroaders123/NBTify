#!/usr/bin/env node

import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, nbt, snbt, json, format, space } from "./args.js";

import type { RootTag } from "../index.js";

await main();

async function main(): Promise<void> {
if (file === undefined) {
  file satisfies never;
  throw new TypeError("Missing argument 'input'");
}

const buffer: Buffer = readFileSync(file);

let input: RootTag | NBTData;

if (file === 0) {
  input = await readBuffer(buffer);
} else {
  try {
    input = await readExtension(buffer, file);
  } catch {
    input = await readBuffer(buffer);
  }
}

async function readExtension(buffer: Buffer, file: string): Promise<RootTag | NBTData> {
  const extension: string = extname(file);
  switch (extension) {
    case ".json": return JSON.parse(buffer.toString("utf-8")) as RootTag;
    case ".snbt": return parse(buffer.toString("utf-8"));
    default: return read(buffer);
  }
}

async function readBuffer(buffer: Buffer): Promise<RootTag | NBTData> {
  try {
    return JSON.parse(buffer.toString("utf-8")) as RootTag;
  } catch {
    try {
      return parse(buffer.toString("utf-8"));
    } catch {
      return read(buffer);
    }
  }
}

const output: NBTData = new NBTData(input, format);

if (!nbt && !snbt && !json) {
  console.log(inspect(output, { colors: true, depth: null }));
  process.exit(0);
}

const stdoutWriteAsync = promisify(process.stdout.write.bind(process.stdout));

const result: string | Uint8Array = json
  ? `${JSON.stringify(output.data, null, space)}\n`
  : snbt
  ? `${stringify(output, { space })}\n`
  : await write(output);
await stdoutWriteAsync(result);
}