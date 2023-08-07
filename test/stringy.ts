import { ByteTag, BooleanTag, DoubleTag, StringTag, ByteArrayTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, NBTData } from "../src/index.js";

const stringy = new NBTData(new CompoundTag({
  Noice: new BooleanTag(true),
  WorkOnBooleanValuesPls: new BooleanTag(true),
  ByteTagValue: new ByteTag(125),
  AnotherProperty: new StringTag("Bananrama!"),
  CheckForNestedJSON: new StringTag(JSON.stringify({
    myJSONKey: new StringTag("It's value!"),
    aBooleanProperty: new BooleanTag(true)
  })),
  ByteArray: new ByteArrayTag([5,28,32,64]),
  IntArray: new IntArrayTag([52,35,78,31]),
  LongArray: new LongArrayTag([45n,82n,100007n,3n]),
  "Escaped Key Name": new StringTag("Tinto Brass"),
  NestedObject: new CompoundTag({
    MyList: new ListTag<DoubleTag>(new DoubleTag(45),new DoubleTag(753),new DoubleTag(123),new DoubleTag(757456)),
    OpethBlackwaterPark: new StringTag("yes"),
    EmptyCompoundObject: new CompoundTag(),
    EmptyArrayList: new ListTag()
  }),
  IndentedList: new ListTag(
    new CompoundTag({
      Key: new StringTag("lock"),
      Door: new StringTag("handle")
    })
  )
}),{ /*name: "",*/ endian: "big", compression: null, bedrockLevel: null });

const edit = new NBTData(stringy,{ compression: "deflate-raw" });
// should inherit 'endian' and 'bedrockLevel', and override 'compression'

const noicea = new NBTData(new CompoundTag(),stringy);

const { name, endian, compression, bedrockLevel } = noicea;
name; // epic
endian;
compression;
bedrockLevel;

export default stringy;