import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import * as NBT from "../src/index.js";

const paths = await readdir(new URL("./nbt/",import.meta.url))
  .then(paths => paths.sort(Intl.Collator().compare));

const files = await Promise.all(paths.map(async name => {
  const buffer = await readFile(new URL(`./nbt/${name}`,import.meta.url));
  return { name, buffer };
}));

describe("Read, Stringify, Parse and Write",() => {
  for (const { name, buffer } of files){
    it(name,async () => {
      /** Disables strict mode for the Legacy Console Edition player data files. */
      const strict = !name.includes("_280dfc");

      /** Reads the NBT file buffer by auto-detecting the file format. */
      const result = await NBT.read(buffer,{ strict });

      /** Stringifies the NBTData result to an SNBT string. */
      const stringified = NBT.stringify(result);

      /** Parses the SNBT string to a new NBTData result. */
      const parsed = NBT.parse(stringified);

      /** Writes the new NBTData result to a recompiled NBT buffer. */
      const recompile = await NBT.write(parsed,result);

      /**
       * Skip the following checks for Legacy Console Edition player data files,
       * as they will never pass the test, because their NBT content length is shorter
       * than the full file size.
      */
      if (!strict) return;
      const { compression } = result;
      const header = (compression !== null && compression !== "deflate-raw") ? 10 : 0;

      /**
       * Compare the original NBT file buffer to that of the recompiled buffer,
       * ensure that they are byte-for-byte the same, asserting that NBTify has
       * it's formats implemented correctly!
      */
      const compare = Buffer.compare(buffer.subarray(header),recompile.subarray(header));
      strictEqual(compare,0,`'${name}' does not symmetrically recompile`);
    });
  }
});