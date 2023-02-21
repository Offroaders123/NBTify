// @ts-check

import { Byte, Short, NBTData } from "../../dist/index.js";

export default new NBTData({
  ByteTag: new Byte(127),
  ShortTag: new Short(258),
  DoubleTag: 84246,
  LongTag: 30154000n,
  CompoundTag: {
    ThisIsAnotherCompoundTag: true
  },
  EmptyList: [],
  Func: () => {
    return "This will not serialize to NBT"
  },
  Method() {
    return "This won't be parseable either"
  },
  Symbol: Symbol(25),
  Undefined: undefined,
  Null: null,
  InvalidListItems: [
    () => {
      return "This will not serialize to NBT"
    },
    Symbol(25),
    undefined,
    null
  ],
  IntArrayTag: new Int32Array([45,8,6,3,2,345,67,887452,123123,254]),
  LongArrayTag: new BigInt64Array([34234n,2343464756n,23425457n])
});