import { write, Int32 } from "../src/index.js";

import type { Tag, RootTagLike, IntTag, CompoundTag } from "../src/index.js";

export type Difficulty = 0 | 1 | 2 | 3;

export interface LevelDat extends CompoundTag {
  Difficulty: IntTag<Difficulty>;
}

export function createLevelDat(): LevelDat {
  return {
    Difficulty: new Int32(2)
  };
}

const levelDat = createLevelDat();
levelDat.Difficulty;

// @ts-expect-error - Property 'NON_THINGO' comes from an index signature. ts(4111)
levelDat.NON_THINGO

await write(levelDat);

// Using classes to build NBT objects is supported too, but less declarative, so I don't recommend it as much.

// Fixed! - // @ts-expect-error - Index signature for type 'string' is missing in type '(Anonymous class)'. ts(1360)
await write(new class {} satisfies RootTagLike);

await write(new class { [name: string]: Tag; } satisfies RootTagLike);