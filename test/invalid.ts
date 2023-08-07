import { ByteTag, BooleanTag, ShortTag, LongTag, DoubleTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, NBTData } from "../src/index.js";

export default new NBTData(new CompoundTag({
  ByteTag: new ByteTag(127),
  ShortTag: new ShortTag(258),
  DoubleTag: new DoubleTag(84246),
  LongTag: new LongTag(30154000n),
  CompoundTag: new CompoundTag({
    ThisIsAnotherCompoundTag: new BooleanTag(true)
  }),
  EmptyList: new ListTag(),
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
  IntArrayTag: new IntArrayTag([45,8,6,3,2,345,67,887452,123123,254]),
  LongArrayTag: new LongArrayTag([34234n,2343464756n,23425457n])
}));