import { parse, writeUncompressed } from "prismarine-nbt";
import { NBTData } from "./format.js";
import { read } from "./read.js";
import { write } from "./write.js";

import type { NBT } from "prismarine-nbt";
import type { RootTag, RootTagLike } from "./tag.js";

export async function toPNBT<T extends RootTagLike = RootTag>(data: T | NBTData<T>): Promise<NBT> {
  data = data instanceof NBTData ? data.data : data;
  return (await parse(Buffer.from(await write(data)))).parsed;
}

export async function fromPNBT<T extends RootTagLike = RootTag>(data: NBT): Promise<T> {
  return (await read<T>(writeUncompressed(data))).data;
}