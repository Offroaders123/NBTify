import Writer from "./Writer.js";
import { tags } from "./tags.js";
import { compress } from "./compression.js";

export default async function write(data,{ endian, encoding } = {}){
  if (!data) throw new Error("Unexpected falsy value for the data parameter");

  const writer = new Writer(endian);

  writer.byte(tags.compound);
  writer.string(data.name);
  writer.compound(data.value);

  let result = writer.getData();

  if (typeof encoding !== "undefined"){
    result = await compress(result,{ encoding });
  }
  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}