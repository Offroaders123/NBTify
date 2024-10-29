#!/usr/bin/env node

import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { getFile, getNBT, getSNBT, getJSON, getFormat, getSpace } from "./args.js";

import type { RootTag } from "../index.js";

const args: string[] = process.argv.slice(2);

process.on("uncaughtException", error => {
  console.error(`${error}`);
  process.exit(1);
});

const stdoutWriteAsync = promisify(process.stdout.write.bind(process.stdout));

  const file = getFile(args);
  const nbt = getNBT(args);
  const snbt = getSNBT(args);
  const json = getJSON(args);
  const format = getFormat(args);
  const space = getSpace(args);

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

  const output: NBTData = new NBTData(input, format);

  if (!nbt && !snbt && !json) {
    console.log(inspect(output, { colors: true, depth: null }));
    process.exit(0);
  }

  const result: string | Uint8Array = json
    ? `${JSON.stringify(output.data, null, space)}\n`
    : snbt
    ? `${stringify(output, { space })}\n`
    : await write(output);
  await stdoutWriteAsync(result);

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