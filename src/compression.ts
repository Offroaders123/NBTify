export interface CompressionOptions {
  format?: "gzip" | "deflate" | "deflate-raw";
}

/**
 * Transforms a Uint8Array through a specific compression format. If a format is not provided, the gzip format will be used.
*/
export async function compress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new CompressionStream(format);
  const readable = new Blob([data]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(readable).arrayBuffer());
}

/**
 * Transforms a Uint8Array through a specific decompression format. If a format is not provided, the gzip format will be used.
*/
export async function decompress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new DecompressionStream(format);
  const readable = new Blob([data]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(readable).arrayBuffer());
}