import { readFile } from "node:fs/promises";
import { read } from "../src/index.js";

import type { RootTag, RootTagLike, NBTData, ReadOptions } from "../src/index.js";

const BlockEntity = new URL("./nbt/BlockEntity.dat", import.meta.url);
// const chunk91_ = new URL("./nbt/chunk91_.dat", import.meta.url);

const data = await readFile(BlockEntity);
console.log(data);

const options: ReadAdjacentOptions = {
  rootName: true,
  endian: "little",
  compression: null,
  bedrockLevel: false
};

// for await (const nbt of readAdjacent(data, options)) {
//   console.log(nbt);
// }

const nbts: NBTData[] = await Array.fromAsync(readAdjacent(data, options));
console.log(nbts);

interface ReadAdjacentOptions extends Omit<ReadOptions, "strict" | "rootCheck"> {}

async function* readAdjacent<T extends RootTagLike = RootTag>(data: Uint8Array, options: ReadAdjacentOptions): AsyncGenerator<NBTData<T>, void, void> {
  let byteOffset: number = 0;

  while (byteOffset < data.byteLength) {
    const nbt: NBTData<T> = await read(data.subarray(byteOffset), { ...options, strict: false });
    byteOffset += nbt.byteOffset!;
    yield nbt;
  }
}