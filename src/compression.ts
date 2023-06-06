const NODE_DEFLATE_RAW_POLYFILL: boolean = await (async () => {
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

/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  if (format === "deflate-raw" && NODE_DEFLATE_RAW_POLYFILL){
    return deflateRawPolyfill(data);
  }
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data,compressionStream);
}

/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  if (format === "deflate-raw" && NODE_DEFLATE_RAW_POLYFILL){
    return inflateRawPolyfill(data);
  }
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data,decompressionStream);
}

async function pipeThroughCompressionStream(data: Uint8Array, { readable, writable }: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = writable.getWriter();

  writer.write(data);
  writer.close();

  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  const generator = (Symbol.asyncIterator in readable) ? readable : readableStreamToAsyncGenerator(readable as ReadableStream<Uint8Array>);

  for await (const chunk of generator){
    chunks.push(chunk);
    byteLength += chunk.byteLength;
  }

  const result = new Uint8Array(byteLength);
  let byteOffset = 0;

  for (const chunk of chunks){
    result.set(chunk,byteOffset);
    byteOffset += chunk.byteLength;
  }

  return result;
}

async function* readableStreamToAsyncGenerator<T>(readable: ReadableStream<T>): AsyncGenerator<T,void,void> {
  const reader = readable.getReader();
  try {
    while (true){
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

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