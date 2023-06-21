import { Int8, NBTData } from "../src/index.js";

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
} as any,{ /*name: "",*/ endian: "big", compression: null, bedrockLevel: null });

const edit = new NBTData(stringy,{ compression: "deflate-raw" });
// should inherit 'endian' and 'bedrockLevel', and override 'compression'

const noicea = new NBTData({},stringy);

const { name, endian, compression, bedrockLevel } = noicea;
name; // epic
endian;
compression;
bedrockLevel;

export default stringy;