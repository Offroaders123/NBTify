#!/usr/bin/env node

import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, nbt, snbt, json, format, space } from "./args.js";

import type { RootTag } from "../index.js";

if (file === undefined){
  file satisfies never;
  throw new TypeError("Missing argument 'input'");
}

const buffer: Buffer = readFileSync(file);

let input: RootTag | NBTData;

if (file === 0){
  try {
    input = JSON.parse(buffer.toString("utf-8")) as RootTag;
  } catch {
    try {
      input = parse(buffer.toString("utf-8"));
    } catch {
      input = await read(buffer);
    }
  }
} else {
  const extension: string = extname(file);
  switch (extension){
    case ".json": {
      input = JSON.parse(buffer.toString("utf-8")) as RootTag;
      break;
    }
    case ".snbt": {
      input = parse(buffer.toString("utf-8"));
      break;
    }
    default: {
      input = await read(buffer);
      break;
    }
  }
}

const output: NBTData = new NBTData(input,format);

if (!nbt && !snbt && !json){
  console.log(inspect(output,{ colors: true, depth: null }));
  process.exit(0);
}

const stdoutWriteAsync = promisify(process.stdout.write.bind(process.stdout));

const result: string | Uint8Array = json
  ? `${JSON.stringify(output.data,null,space ?? 2)}\n`
  : snbt
  ? `${stringify(output,{ space: space ?? 2 })}\n`
  : await write(output);
await stdoutWriteAsync(result);