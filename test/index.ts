import { readFile } from "node:fs/promises";
import { read } from "../src/index.js";
import { rejects } from "node:assert";

const helloWorld = new URL("./nbt/hello_world.nbt", import.meta.url);

const data = await readFile(helloWorld);
console.log(data);

const nbt0 = await read(data);
console.log(nbt0);

await rejects(async () => {
  const nbt1 = await read(data, { rootName: "SHOULD_ERROR" });
  console.log(nbt1);
});