import Writer from "./Writer.js";
import { tags } from "./tags.js";

export default function write(data){
  if (!data) throw new Error(`Argument "data" is falsy`);

  const writer = new Writer();

  writer.byte(tags.compound);
  writer.string(data.name);
  writer.compound(data.value);

  return writer.getData();
}