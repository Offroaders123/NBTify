/**
 * A simple compression wrapper which accepts a Uint8Array, and returns a Promise which resolves to the compressed version. Defaults to using the gzip format.
*/
export async function compress(data: Uint8Array, { format = "gzip" }: { format?: "gzip" | "deflate" | "deflate-raw"; } = {}){
  const stream = new CompressionStream(format);
  return await pipeThrough(data,stream);
}

/**
 * A simple decompression wrapper which accepts a compressed Uint8Array, and returns a Promise which resolves to the decompressed version. Defaults to using the gzip format.
*/
export async function decompress(data: Uint8Array, { format = "gzip" }: { format?: "gzip" | "deflate" | "deflate-raw"; } = {}){
  const stream = new DecompressionStream(format);
  return await pipeThrough(data,stream);
}

async function pipeThrough(data: Uint8Array, stream: TransformStream){
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const { readable } = stream;
  return new Uint8Array(await new Response(readable).arrayBuffer());
}