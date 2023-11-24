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

async function pipeThroughCompressionStream(data: Uint8Array, { readable, writable }: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = writable.getWriter();

  writer.write(data).catch(() => {});
  writer.close().catch(() => {});

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