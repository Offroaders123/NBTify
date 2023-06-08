import { Int8, NBTData } from "../../src/index.js";

const stringy = new NBTData({
  Noice: true,
  WorkOnBooleanValuesPls: true,
  ByteTagValue: new Int8(125),
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
},{ name: "", endian: "big", compression: null, bedrockLevel: null });

const { name, endian, compression, bedrockLevel } = stringy;
name;
endian;
compression;
bedrockLevel;

export default stringy;