import { describe, it } from "node:test";
import { strictEqual, throws } from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import * as NBT from "../src/index.js";

const paths = await readdir(new URL("./nbt/", import.meta.url))
  .then(paths => paths.sort(Intl.Collator().compare));

const files = await Promise.all(paths.map(async name => {
  const buffer = await readFile(new URL(`./nbt/${name}`, import.meta.url));
  return { name, buffer };
}));

describe("Read, Stringify, Parse and Write", () => {
  for (const { name, buffer } of files) {
    if (name.includes("varint")) continue;
    it(name, async () => {
      /** Determines if the file is SNBT */
      const snbt = name.endsWith(".snbt");

      /** Reads the SNBT List Item assertion type file. */
      const listItemAssertion = snbt && name.startsWith("list_item_check");

      /** Determines if the test is for checking empty list handling. */
      const emptyList = name.startsWith("empty");

      /** Disables strict mode for the Legacy Console Edition player data files. */
      const strict = !name.includes("_280dfc");

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
      const parsed = NBT.parse<NBT.RootTag>(stringified);

      /** Writes the new NBTData result to a recompiled NBT buffer. */
      const recompile = (snbt)
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
      const compression = (result instanceof NBT.NBTData)
        ? result.compression
        : null;
      const header = (compression !== null && compression !== "deflate-raw") ? 10 : 0;

      const control = (snbt)
        ? Buffer.from(stringified)
        : buffer.subarray(header);

      const experiment = recompile.subarray(header);

      /**
       * Compare the original NBT file buffer to that of the recompiled buffer,
       * ensure that they are byte-for-byte the same, asserting that NBTify has
       * it's formats implemented correctly!
      */
      const compare = Buffer.compare(control, experiment);
      strictEqual(compare, 0, `'${name}' does not symmetrically recompile`);

      // console.log(result);
      const pnbt = await NBT.toPNBT(result);
      // console.log(pnbt);
      const nbt = await NBT.fromPNBT(pnbt);
      // console.log(nbt);

      const pnbtControl = await NBT.write(result instanceof NBT.NBTData ? result.data : result);
      const pnbtExperiment = await NBT.write(nbt);

      const pnbtCompare = Buffer.compare(pnbtControl, pnbtExperiment);
      strictEqual(pnbtCompare, 0, `'${name}' does not symmetrically convert back and forth between Prismarine-NBT`);
    });
  }
});