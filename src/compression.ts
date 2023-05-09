export type CompressionFormat = "gzip" | "deflate" | "deflate-raw";

export interface CompressionOptions {
  format: CompressionFormat;
}

/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data: Uint8Array | ArrayBufferLike, { format }: CompressionOptions): Promise<Uint8Array> {
  const { body } = new Response(data instanceof Uint8Array ? data : new Uint8Array(data));
  const readable = body!.pipeThrough(new CompressionStream(format));
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data: Uint8Array | ArrayBufferLike, { format }: CompressionOptions): Promise<Uint8Array> {
  const { body } = new Response(data instanceof Uint8Array ? data : new Uint8Array(data));
  const readable = body!.pipeThrough(new DecompressionStream(format));
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}