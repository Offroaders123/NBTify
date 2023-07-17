import { write, Int32 } from "../src/index.js";

import type { Tag, IntTag, CompoundTag } from "../src/tag.js";

export type Difficulty = IntTag<0 | 1 | 2 | 3>;

export interface BedrockLevelDatLike extends CompoundTag {
  Difficulty: Difficulty;
}

export class BedrockLevelDat implements BedrockLevelDatLike {
  [name: string]: Tag;

  Difficulty: Difficulty = new Int32(2);
}

const levelDat = new BedrockLevelDat();

await write(levelDat);