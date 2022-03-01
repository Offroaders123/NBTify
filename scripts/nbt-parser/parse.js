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
export default function parse(data){
  if (!data) throw new Error(`Argument "data" is falsy`);

  if (hasGzipHeader(data)) data = new Zlib.Gunzip(new Uint8Array(data)).decompress().buffer;

  const reader = new Reader(data);

  const type = reader.byte();
  if (type !== tags.compound) throw new Error("Top tag must be a compound");

  const result = {
    name: reader.string(),
    value: reader.compound()
  };
  return result;
}

function hasGzipHeader(data){
  const header = new Uint8Array(data.slice(0,2));
  const result = (header.length === 2 && header[0] === 0x1f && header[1] === 0x8b);
  return result;
}