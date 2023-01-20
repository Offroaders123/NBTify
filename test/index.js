// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

/** @type { NBT.CompoundTag } */
const source = {
  MyClassCompound: {...new class MyClass {
    IAmAValidKey = true;
  }},
  InvalidRegExpObject: new RegExp(/searcher/),
  NonCompatibleTextDecoder: new TextDecoder(),
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
    new RegExp(/searcher/),
    new TextDecoder(),
    () => {
      return "This will not serialize to NBT"
    },
    Symbol(25),
    undefined,
    null
  ]
};
console.log(source);

const reversify = await NBT.write(source).then(NBT.read);
console.log(reversify.data);