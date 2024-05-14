import { NBTData, read, write } from "../src/index.js";

const demo = { hi: 5 };
console.log(await read(await write(new NBTData(demo, { endian: "big" }), { endian: "little" })));
console.log(await read(await write(demo, { endian: "little" })));

// const path = new URL("./nbt/hello_world.nbt", import.meta.url);
// const buffer: Buffer = await readFile(path);

// const nbt = await read<any>(buffer);
// console.log(nbt);
// nbt.data.StorageVersion = new Int32(8);

// const sameThang = nbt; // new NBTData(nbt, { endian: "little", bedrockLevel: true });
// // @ts-expect-error
// sameThang.endian = "🌭";
// sameThang.endian = "little";
// sameThang.bedrockLevel = true;
// console.log(sameThang);

// const result = await write(sameThang);
// console.log(result);