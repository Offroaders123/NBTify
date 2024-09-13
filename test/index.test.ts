import { describe, it } from "node:test";
import { rejects, strictEqual, throws } from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import * as NBT from "../src/index.js";

const paths: string[] = await readdir(new URL("./nbt/", import.meta.url))
  .then(paths => paths.sort(Intl.Collator().compare));

const files: { name: string; buffer: Buffer; }[] = await Promise.all(paths.map(async name => {
  const buffer = await readFile(new URL(`./nbt/${name}`, import.meta.url));
  return { name, buffer };
}));

describe("Read, Stringify, Parse and Write", () => {
  for (const { name, buffer } of files) {
    it(name, async () => {
      if (name.includes("hello_world")) {
        await rejects(async () => {
          await NBT.read(buffer, { rootName: "SHOULD_ERROR" });
        }, `'${name}' should only parse when passing in a root name of 'true' or 'hello_world'`);
      }

      /** Determines if the file is SNBT */
      const snbt: boolean = name.endsWith(".snbt");

      /** Reads the SNBT List Item assertion type file. */
      const listItemAssertion: boolean = snbt && name.startsWith("list_item_check");

      /** Determines if the test is for checking empty list handling. */
      const emptyList: boolean = name.startsWith("empty");

      /** Disables strict mode for the Legacy Console Edition player data files. */
      const strict: boolean = !name.includes("_280dfc");

      /** Reads the NBT file buffer by auto-detecting the file format. */
      const result: void | NBT.RootTag | NBT.NBTData = (snbt)
        ? (listItemAssertion)
          ? throws(() => NBT.parse<NBT.RootTag>(buffer.toString("utf-8")), `'${name}' parses from SNBT when it shouldn't`)
          : NBT.parse<NBT.RootTag>(buffer.toString("utf-8"))
        : await NBT.read<NBT.RootTag>(buffer, { strict });
      if (result === undefined) return;

      /** Stringifies the NBTData result to an SNBT string. */
      const stringified: string | void = (listItemAssertion)
        ? throws(() => NBT.stringify(result), `'${name}' stringifies to SNBT when it shouldn't`)
        : NBT.stringify(result);
      if (stringified === undefined) return;

      /** Parses the SNBT string to a new NBTData result. */
      const parsed: NBT.RootTag = NBT.parse<NBT.RootTag>(stringified);

      /** Writes the new NBTData result to a recompiled NBT buffer. */
      const recompile: Buffer | Uint8Array = (snbt)
        ? Buffer.from(NBT.stringify(parsed,
          (snbt)
            ? undefined
            : { space: 2 }
          ))
        : await NBT.write(
          (emptyList)
            ? result
            : parsed
          , (result instanceof NBT.NBTData) ? result : {});

      /**
       * Skip the following checks for Legacy Console Edition player data files,
       * as they will never pass the test, because their NBT content length is shorter
       * than the full file size.
      */
      if (!strict) return;
      const compression: NBT.Compression = (result instanceof NBT.NBTData)
        ? result.compression
        : null;
      const header: 0 | 10 = (compression !== null && compression !== "deflate-raw") ? 10 : 0;

      const control: Buffer = (snbt)
        ? Buffer.from(stringified)
        : buffer.subarray(header);

      const experiment: Buffer | Uint8Array = recompile.subarray(header);

      /**
       * Compare the original NBT file buffer to that of the recompiled buffer,
       * ensure that they are byte-for-byte the same, asserting that NBTify has
       * it's formats implemented correctly!
      */
      const compare: 0 | 1 | -1 = Buffer.compare(control, experiment);
      strictEqual(compare, 0, `'${name}' does not symmetrically recompile`);
    });
  }
});