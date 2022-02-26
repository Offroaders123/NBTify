import tagTypes from "./tagTypes.js";

import Reader from "./Reader.js";

export default function parseUncompressed(data){
  if (!data) throw new Error(`Argument "data" is falsy`);

  const reader = new Reader(data);

  const type = reader.byte();
  if (type !== tagTypes.compound) throw new Error("Top tag should be a compound");

  return {
    name: reader.string(),
    value: reader.compound()
  };
}