import Reader from "./Reader.js";
import { tags } from "./tags.js";

/*
  This accepts both gzipped and uncompressd NBT archives.
  If the archive is uncompressed, the callback will be
  called directly from this method. For gzipped files, the
  callback is async.

  For use in the browser, window.zlib must be defined to decode
  compressed archives. It will be passed a Buffer if the type is
  available, or an Uint8Array otherwise.
*/
export default function parse(data,{ endian = "big" } = {}){
  if (!data) throw new Error(`Argument "data" is falsy`);

  if (hasGzipHeader(data)) data = new Zlib.Gunzip(new Uint8Array(data)).decompress().buffer;

  /* Remove the Bedrock level header bytes if they are present in the data */
  if (hasBedrockLevelHeader(data)) data = data.slice(8);

  /*
    The "endian" parameter determines how the data should be parsed. Java NBT uses the
    "big" endian format (the default for the function), and Bedrock NBT uses "little" endian.
  */
  const reader = new Reader(data,endian);

  const type = reader.byte();
  if (type !== tags.compound) throw new Error("Top tag must be a compound");

  const result = {
    name: reader.string(),
    value: reader.compound()
  };
  return result;
}

function hasBedrockLevelHeader(data){
  const header = new Uint8Array(data.slice(0,4));
  const result = (header[1] === 0 && header[2] === 0 && header[3] === 0);
  return result;
}

function hasGzipHeader(data){
  const header = new Uint8Array(data.slice(0,2));
  const result = (header.length === 2 && header[0] === 31 && header[1] === 139);
  return result;
}