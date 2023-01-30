// @ts-check

import * as fs from "node:fs/promises";
import * as NBT from "../dist/index.js";

// const data = await fs.readFile(new URL("./nbt/level.dat",import.meta.url));
// // console.log(data,"\n");

// const result = await NBT.read(data);
const result = new NBT.NBTData({
  Noice: true,
  WorkOnBooleanValuesPls: true,
  ByteTagValue: new NBT.Byte(125),
  AnotherProperty: "Bananrama!",
  CheckForNestedJSON: JSON.stringify({
    myJSONKey: "It's value!",
    aBooleanProperty: true
  }),
  ByteArray: new Int8Array([5,28,32,64]),
  IntArray: new Int32Array([52,35,78,31]),
  LongArray: new BigInt64Array([45n,82n,100007n,3n]),
  "Escaped Key Name": "Tinto Brass",
  NestedObject: {
    MyList: [45,753,123,757456],
    OpethBlackwaterPark: "yes",
    EmptyCompoundObject: {},
    EmptyArrayList: []
  },
  IndentedList: [
    {
      Key: "lock",
      Door: "handle"
    }
  ]
});
// console.log(result.data,"\n");

const data = await NBT.write(result).then(Buffer.from);
// console.log(data,"\n");

const stringed = NBT.stringify(result.data,2);
console.log(stringed,"\n");

const parsed = /** @type { NBT.CompoundTag } */
  (NBT.parse(stringed));
// console.log(parsed,"\n");

// Using the base 'result' NBTData object as the WriteOptions
const recompile = await NBT.write(parsed,result); 
// console.log(Buffer.from(recompile),"\n");

console.log(Buffer.compare(data,recompile));