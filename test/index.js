// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

/**
 * @implements NBT.RootTag
*/
class NBTSourceClass {
  get [NBT.toNBT]() {
    return this;
  }

  InvalidRegExpObject = new RegExp(/searcher/);
  NonCompatibleTextDecoder = new TextDecoder();
  Func = () => {
    return "This will not serialize to NBT"
  };
  Method() {
    return "This won't be parseable either"
  };
  Symbol = Symbol(25);
  Undefined = undefined;
  Null = null;
  WillPass = {
    ByteTag: new NBT.Byte(127),
    ShortTag: new NBT.Short(258),
    DoubleTag: 84246,
    LongTag: 30154000n,
    CompoundTag: {
      ThisIsAnotherCompoundTag: true
    },
    EmptyList: [],
    InvalidListItems: [
      Object.freeze([new RegExp(/searcher/)]),
      Object.freeze([new TextDecoder()]),
      Object.freeze([() => {
        return "This will not serialize to NBT"
      }]),
      Object.freeze([Symbol(25)]),
      Object.freeze([undefined]),
      Object.freeze([null])
    ],
    IntArrayTag: new Int32Array([45,8,6,3,2,345,67,887452,123123,254]),
    LongArrayTag: new BigInt64Array([34234n,2343464756n,23425457n])
  }
}

class NBTSource extends NBT.NBTData {
  // declare data: NBTSourceClass;

  constructor() {
    super(/** @type { NBT.RootTag } */ (new NBTSourceClass()));
  }
}

const source = new NBTSource();
console.log(source.data.WillPass);

const reversify = await NBT.write(source).then(NBT.read);
console.log(reversify.data.WillPass);