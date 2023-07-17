import { write, Int32 } from "../src/index.js";

import type { Tag, IntTag, CompoundTag } from "../src/index.js";

export type Difficulty = IntTag<0 | 1 | 2 | 3>;

export interface BedrockLevelDatLike extends CompoundTag {
  Difficulty: Difficulty;
}

export class BedrockLevelDat implements BedrockLevelDatLike {
  [name: string]: Tag;

  Difficulty: Difficulty = new Int32(2);
}

const levelDat = new BedrockLevelDat();
levelDat.Difficulty;

// @ts-expect-error - Property 'NON_THINGO' comes from an index signature. ts(4111)
levelDat.NON_THINGO

await write(levelDat);

// @ts-expect-error - Index signature for type 'string' is missing in type '(Anonymous class)'. ts(1360)
await write(new class {} satisfies CompoundTag);

await write(new class { [name: string]: Tag; });