import { Int8, Int16, NBTData } from "../src/index.js";

import type { RootTag } from "../src/index.js";

export default new NBTData({
  ByteTag: new Int8(127),
  ShortTag: new Int16(258),
  DoubleTag: 84246,
  LongTag: 30154000n,
  CompoundTag: {
    ThisIsAnotherCompoundTag: true
  },
  EmptyList: [],
  // @ts-expect-error
  Func: () => {
    return "This will not serialize to NBT"
  },
  // @ts-expect-error
  Method() {
    return "This won't be parseable either"
  },
  // @ts-expect-error
  Symbol: Symbol(25),
  //// @ts-expect-error
  Undefined: undefined,
  // @ts-expect-error
  Null: null,
  InvalidListItems: [
    // @ts-expect-error
    () => {
      return "This will not serialize to NBT"
    },
    // @ts-expect-error
    Symbol(25),
    //// @ts-expect-error
    undefined,
    // @ts-expect-error
    null
  ],
  IntArrayTag: new Int32Array([45, 8, 6, 3, 2, 345, 67, 887452, 123123, 254]),
  LongArrayTag: new BigInt64Array([34234n, 2343464756n, 23425457n])
} satisfies RootTag);