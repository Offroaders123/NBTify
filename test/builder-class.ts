import { write, Tag, IntTag, CompoundTag } from "../src/index.js";

export type Difficulty = IntTag<0 | 1 | 2 | 3>;

export interface LevelDat extends CompoundTag {
  Difficulty: Difficulty;
}

export function createLevelDat(): LevelDat {
  return new CompoundTag({
    Difficulty: new IntTag(2)
  }) as LevelDat;
}

const levelDat = createLevelDat();
levelDat.Difficulty;

// @ts-expect-error - Property 'NON_THINGO' comes from an index signature. ts(4111)
levelDat.NON_THINGO

await write(levelDat);

// Using classes to build NBT objects is supported too, but less declarative, so I don't recommend it as much.

// @ts-expect-error - Index signature for type 'string' is missing in type '(Anonymous class)'. ts(1360)
await write(new class {} satisfies CompoundTag);

await write(new class { [name: string]: Tag; } as CompoundTag);