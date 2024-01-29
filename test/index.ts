import { readFile } from "node:fs/promises";
import * as NBT from "../src/index.js";
import { inspect } from "node:util";

const path = new URL("./nbt/hello_world.nbt",import.meta.url);

const buffer: Buffer = await readFile(path);
const arrayBuffer: ArrayBufferLike = buffer.buffer;
const uint8Array: Uint8Array = new Uint8Array(buffer.buffer);
const blob: Blob = new Blob([buffer]);
const file: File = new File([buffer],path.pathname.split("/").pop()!);
const response: Response = new Response(blob);

const inputs = [arrayBuffer,uint8Array,buffer,blob,file,response];
for (const input of inputs){
  console.log(input,"\n");
}

const nbt: (string | NBT.NBTData)[] = await Promise.all(
  inputs
    .map(blob =>
      NBT.read(blob)
        // .then(() => true)
        .catch((error: unknown) => `${error}`)
      )
    );
console.log(inspect(nbt,{ colors: true, getters: true }));

// const haha = await fetch("https://wiki.bedrock.dev/assets/nbt/nbt_example_file.nbt")
//   .then(response => NBT.read(response));
// console.log(haha);