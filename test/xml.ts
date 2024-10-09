import { readFile } from "node:fs/promises";
import { parseXML } from "../src/xml.js";

const bigtest = new URL("./nbt/bigtest.xml", import.meta.url);

const data: string = await readFile(bigtest, "utf-8");
console.log(data);

const nodes = parseXML(data);
console.log(nodes);