export interface CompressionOptions {
  format?: "gzip" | "deflate" | "deflate-raw";
}

/**
 * Transforms a Uint8Array through a specific compression format. If a format is not provided, the gzip format will be used.
*/
export async function compress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new CompressionStream(format);
  return await pipeThrough(data,stream);
}

/**
 * Transforms a Uint8Array through a specific decompression format. If a format is not provided, the gzip format will be used.
*/
export async function decompress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new DecompressionStream(format);
  return await pipeThrough(data,stream);
}

async function pipeThrough(data: Uint8Array, stream: TransformStream<Uint8Array,BufferSource>){
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const { readable } = stream;
  return new Uint8Array(await new Response(readable).arrayBuffer());
}