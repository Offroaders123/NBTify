#!/usr/bin/env node

import { extname } from "node:path";
import { readFile } from "node:fs/promises";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, nbt, snbt, format, space } from "./args.js";

import type { RootTag } from "../index.js";

(async () => {

if (file === undefined){
  file satisfies never;
  throw new TypeError("Missing argument 'input'");
}

const buffer: Buffer = await readFile(file);

const input: RootTag | NBTData = extname(file) === ".snbt"
  ? parse(buffer.toString())
  : await read(buffer);

const output: NBTData = new NBTData(input,format);

if (!nbt && !snbt){
  const result: string | NBTData = snbt
    ? stringify(output,{ space: 2 })
    : output;
  console.log(inspect(result,{ colors: true, depth: Infinity }));
  process.exit(0);
}

const result: string | Uint8Array = snbt
  ? `${stringify(output,{ space: space ?? 2 })}\n`
  : await write(output);
await promisify(process.stdout.write.bind(process.stdout))(result);

})();