import hasGzipHeader from "./hasGzipHeader.js";

import parseUncompressed from "./parseUncompressed.js";

/*
  This accepts both gzipped and uncompressd NBT archives.
  If the archive is uncompressed, the callback will be
  called directly from this method. For gzipped files, the
  callback is async.

  For use in the browser, window.zlib must be defined to decode
  compressed archives. It will be passed a Buffer if the type is
  available, or an Uint8Array otherwise.
*/
export default function parse(data,callback){
  if (!data) throw new Error(`Argument "data" is falsy`);

  if (!hasGzipHeader(data)){
    callback(null,parseUncompressed(data));
  } else if (!zlib){
    callback(new Error("NBT archive is compressed but zlib is not available"),null);
  } else {
    /* zlib.gunzip take a Buffer, at least in Node, so try to convert if possible. */
    const buffer = (data.length) ? data : new Uint8Array(data);
    zlib.gunzip(buffer,(error,uncompressed) => {
      if (error){
        callback(error,null);
      } else {
        callback(null,parseUncompressed(uncompressed));
      }
    });
  }
}