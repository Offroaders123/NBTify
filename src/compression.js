/**
 * A simple compression wrapper which accepts a `Uint8Array`,
 * and returns a `Promise` which resolves to the compressed
 * version of that `Uint8Array`.
 * 
 * Defaults to using the gzip format.
 * 
 * @param { Uint8Array } data
 * @param { { format?: "gzip" | "deflate" | "deflate-raw"; } } [options]
*/
export async function compress(data,{ format = "gzip" } = {}){
  const stream = new CompressionStream(format);
  return await pipeThrough(data,stream);
}

/**
 * A simple decompression wrapper which accepts a compressed
 * `Uint8Array`, and returns a `Promise` which resolves to the
 * decompressed version of that `Uint8Array`.
 * 
 * Defaults to using the gzip format.
 * 
 * @param { Uint8Array } data
 * @param { { format?: "gzip" | "deflate" | "deflate-raw"; } } [options]
*/
export async function decompress(data,{ format = "gzip" } = {}){
  const stream = new DecompressionStream(format);
  return await pipeThrough(data,stream);
}

/**
 * @param { Uint8Array } data
 * @param { TransformStream } stream
*/
async function pipeThrough(data,stream){
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const { readable } = stream;
  return new Uint8Array(await new Response(readable).arrayBuffer());
}