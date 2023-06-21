import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";

const FILES = {
  BIGTEST: "bigtest.nbt",
  EMPTY_LIST: "empty_list.nbt",
  EXTREME: "extreme.nbt",
  HELLO_WORLD: "hello_world.nbt",
  BEDROCK_LEVEL: "level.dat",
  LIST_ROOT: "list-root.nbt",
  MCA_CHUNK: "mca-chunk.nbt",
  LCE_PLAYER_0: "N_280dfc7dac2f_100000001_.dat",
  LCE_PLAYER_1: "P_280dfc7dac2f_00000001_knarF_520.dat",
  RIDICULOUS: "ridiculous.nbt",
  SIMPLE_HOUSE: "simple_house.nbt",
  UNNAMED: "unnamed.nbt"
} as const;

describe("Read, Stringify, Parse and Write",() => {
  for (const [FILE,PATH] of Object.entries(FILES)){
    it(PATH,async () => {
      const buffer = await readFile(new URL(`./nbt/${PATH}`,import.meta.url));
      const strict = !FILE.startsWith("LCE_PLAYER");
      const result = await NBT.read(buffer,{ strict });
      const stringified = NBT.stringify(result);
      const parsed = NBT.parse(stringified);
      const recompile = await NBT.write(parsed,result);
      if (!strict) return;
      const { compression } = result;
      const header = (compression !== null && compression !== "deflate-raw") ? 10 : 0;
      const compare = Buffer.compare(buffer.subarray(header),recompile.subarray(header));
      strictEqual(compare,0,`'${PATH}' does not symmetrically recompile`);
    });
  }
});