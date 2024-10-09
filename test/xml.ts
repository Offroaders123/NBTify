import { readFile } from "node:fs/promises";
import { parseXML } from "../src/xml.js";
import { parse, stringify, type RootTag } from "../src/index.js";

const xml = new URL("./nbt/bigtest.xml", import.meta.url);
const snbt = new URL("./nbt/bigtest.snbt", import.meta.url);

const xmlData: string = await readFile(xml, "utf-8");
console.log(xmlData);

const snbtData: string = stringify(parse(await readFile(snbt, "utf-8")), { space: 2 });

const nodes: RootTag = parseXML(xmlData);
console.log(nodes);

const stringed: string = stringify(nodes, { space: 2 });
console.log(snbtData);
console.log(stringed);

const diff = Buffer.compare(Buffer.from(snbtData), Buffer.from(stringed));
console.log(diff);