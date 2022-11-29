// @ts-check

import { Int, NBTData } from "../dist/index.js";

const data = new NBTData({ noice: 5 },{ compression: "zlib" });
console.log(data);

const data2 = new NBTData(data,{ name: "noice", endian: "little", compression: null, bedrockLevel: new Int(8) });
console.log(data2);

const data3 = new NBTData(data2,{ name: "noice2", compression: "gzip", bedrockLevel: null });
console.log(data3);

const data4 = new NBTData(data3,{ name: "", endian: "big", compression: null, bedrockLevel: new Int(3) });
console.log(data4);