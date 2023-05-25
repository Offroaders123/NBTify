export type CompressionFormat = "deflate" | "deflate-raw" | "gzip";

/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data,compressionStream);
}

/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data,decompressionStream);
}

async function pipeThroughCompressionStream(data: Uint8Array, compressionStream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = compressionStream.writable.getWriter();

  writer.write(data);
  writer.close();

  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  for await (const chunk of readableStreamToAsyncGenerator(compressionStream.readable)){
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

async function* readableStreamToAsyncGenerator(stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array,void,void> {
  const reader = stream.getReader();

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