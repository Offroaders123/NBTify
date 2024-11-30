import { describe, it } from "node:test";
import assert, { deepStrictEqual, rejects, strictEqual, throws } from "node:assert";
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

      /** Disables strict mode for Bedrock LevelDB and Legacy Console Edition player data files. */
      const strict: boolean = !/^BlockEntity|^chunk91|_280dfc/.test(name);

      /** Reads the NBT file buffer by auto-detecting the file format. */
      const result: void | NBT.RootTag | NBT.NBTData = (snbt)
        ? (listItemAssertion)
          ? throws(() => NBT.parse<NBT.RootTag>(buffer.toString("utf-8")), `'${name}' parses from SNBT when it shouldn't`)
          : NBT.parse<NBT.RootTag>(buffer.toString("utf-8"))
        : await NBT.read<NBT.RootTag>(buffer, { strict });
      if (result === undefined) return;

      if (!strict && result instanceof NBT.NBTData) {
        assert(result.byteOffset !== null, `'${name}' should have bytes remaining because it shouldn't be parseable with strict mode`);
      }

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

const TAG_ALERTER = 250;

class Alerter {
  readonly message: string;

  constructor(message: string) {
    if (message.length > 255) {
      throw new RangeError("Message is too long!");
    }
    this.message = message;
  }

  get length(): number {
    return this.message.length;
  }

  alert(): void {
    console.log(this.message);
  }
}

const thirdPartyAPI = {
  heya: 25n,
  what: [
    {
      aa: "Sweet",
      l: {}
    }
  ],
  sets: new Set([
    new Set([25, {}]),
    new Set([92, 5n])
  ]),
  customTag: new Alerter("hello world!")
};
// console.log(thirdPartyAPI);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const replacer: NBT.Replacer = function(_key, value) {
  switch (true) {
    case value instanceof Set: return { $__custom: "Set", value: { ...[...value] } };
    case value instanceof Alerter: return new Int8Array([TAG_ALERTER, value.length, ...encoder.encode(value.message)]);
    default: return value;
  }
};

const reviver: NBT.Reviver = function(_key, value) {
  if (NBT.getTagType(value) === NBT.TAG.BYTE_ARRAY && NBT.isTag<NBT.ByteArrayTag>(value)) {
    const message: string = decoder.decode(value.subarray(2));
    if (message.length !== value[1]) return value;
    return new Alerter(message);
  }
  if (!(typeof value === "object" && "$__custom" in value)) return value;
  switch (value.$__custom) {
    case "Set": return new Set(Object.values(value.value));
    default: return value;
  }
};

describe("Replace, and Revive", async () => {
  const bruce: Uint8Array = await NBT.write(thirdPartyAPI, undefined, replacer);
  // console.dir((await NBT.read(bruce)).data, { depth: null });
  const PARTERY: typeof thirdPartyAPI = (await NBT.read<typeof thirdPartyAPI>(bruce, undefined, reviver)).data;
  deepStrictEqual(thirdPartyAPI, PARTERY);
});