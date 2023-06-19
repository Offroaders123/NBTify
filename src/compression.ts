/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  if (format === "deflate-raw" && await NODE_DEFLATE_RAW_POLYFILL){
    return deflateRawPolyfill(data);
  }
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data,compressionStream);
}

/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  if (format === "deflate-raw" && await NODE_DEFLATE_RAW_POLYFILL){
    return inflateRawPolyfill(data);
  }
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data,decompressionStream);
}

async function pipeThroughCompressionStream(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const { body } = new Response(data);
  const readable = body!.pipeThrough(stream);
  const buffer = await new Response(readable).arrayBuffer();
  return new Uint8Array(buffer);
}

const NODE_DEFLATE_RAW_POLYFILL: Promise<boolean> = (async () => {
  try {
    new CompressionStream("deflate-raw");
    new DecompressionStream("deflate-raw");
    return false;
  } catch {
    try {
      await import("node:zlib");
      return true;
    } catch {
      return false;
    }
  }
})();

async function deflateRawPolyfill(data: Uint8Array): Promise<Uint8Array> {
  const { promisify } = await import("node:util");
  const { deflateRaw } = await import("node:zlib");
  const deflateRawAsync = promisify(deflateRaw);
  const { buffer, byteOffset, byteLength } = await deflateRawAsync(data);
  return new Uint8Array(buffer,byteOffset,byteLength);
}

async function inflateRawPolyfill(data: Uint8Array): Promise<Uint8Array> {
  const { promisify } = await import("node:util");
  const { inflateRaw } = await import("node:zlib");
  const inflateRawAsync = promisify(inflateRaw);
  const { buffer, byteOffset, byteLength } = await inflateRawAsync(data);
  return new Uint8Array(buffer,byteOffset,byteLength);
}