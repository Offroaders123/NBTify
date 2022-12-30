export type CompressionFormat = "gzip" | "deflate" | "deflate-raw";

export interface CompressionOptions {
  format?: CompressionFormat;
}

/**
 * Transforms a Uint8Array through a specific compression format. If a format is not provided, the gzip format will be used.
*/
export async function compress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new CompressionStream(format);
  const readable = new Blob([data]).stream().pipeThrough(stream);
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Transforms a Uint8Array through a specific decompression format. If a format is not provided, the gzip format will be used.
*/
export async function decompress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new DecompressionStream(format);
  const readable = new Blob([data]).stream().pipeThrough(stream);
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}