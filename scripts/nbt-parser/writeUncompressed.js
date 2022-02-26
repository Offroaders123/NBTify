import tagTypes from "./tagTypes.js";

import Writer from "./Writer.js";

export default function writeUncompressed(value){
  if (!value) throw new Error(`Argument "value" is falsy`);
  const writer = new Writer();

  writer.byte(tagTypes.compound);
  writer.string(value.name);
  writer.compound(value.value);

  return writer.getData();
}