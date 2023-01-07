// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

class NBTSourceClass {
  InvalidRegExpObject = new RegExp(/searcher/);
  NonCompatibleTextDecoder = new TextDecoder();
  Func = () => {
    return "This will not serialize to NBT";
  }
  WillPass = {
    ByteTag: new NBT.Byte(127),
    ShortTag: new NBT.Short(258),
    DoubleTag: 84246,
    LongTag: 30154000n,
    CompoundTag: {
      ThisIsAnotherCompoundTag: true
    },
    IntArrayTag: new Int32Array([45,8,6,3,2,345,67,887452,123123,254]),
    LongArrayTag: new BigInt64Array([34234n,2343464756n,23425457n])
  }
}

const source = new NBTSourceClass();
console.log(source);

const reversify = await NBT.write(source).then(NBT.read);
console.log(reversify);