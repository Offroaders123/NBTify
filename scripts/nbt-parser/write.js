import Writer from "./Writer.js";
import { tags } from "./tags.js";

export default function write(data,{ endian = "big", gzip = false } = {}){
  if (!data) throw new Error(`Argument "data" is falsy`);

  /*
    The "endian" parameter determines how the data should be parsed. Java NBT uses the
    "big" endian format (the default for the function), and Bedrock NBT uses "little" endian.
  */
  const writer = new Writer(endian);

  writer.byte(tags.compound);
  writer.string(data.name);
  writer.compound(data.value);

  const result = writer.getData();

  /* Using GZIP compression while writing NBT data doesn't work as expected at the moment. */
  return (gzip) ? new Zlib.Gzip(new Uint8Array(result)).compress().buffer : result;
}