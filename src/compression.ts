/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data, compressionStream);
}

/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data, decompressionStream);
}

async function pipeThroughCompressionStream(data: Uint8Array, { readable, writable }: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer: WritableStreamDefaultWriter<BufferSource> = writable.getWriter();

  writer.write(data).catch(() => {});
  writer.close().catch(() => {});

  const chunks: Uint8Array[] = [];
  let byteLength: number = 0;

  const iterator: AsyncIterable<Uint8Array> = readableStreamToAsyncIterable(readable);

  for await (const chunk of iterator) {
    chunks.push(chunk);
    byteLength += chunk.byteLength;
  }

  const result = new Uint8Array(byteLength);
  let byteOffset: number = 0;

  for (const chunk of chunks) {
    result.set(chunk, byteOffset);
    byteOffset += chunk.byteLength;
  }

  return result;
}

function readableStreamToAsyncIterable<T>(readable: ReadableStream<T>): AsyncIterable<T> {
  if (typeof readable[Symbol.asyncIterator] === "undefined") {
    return readableStreamToAsyncGenerator(readable);
  }
  return readable;
}

async function* readableStreamToAsyncGenerator<T>(readable: ReadableStream<T>): AsyncGenerator<T, void, void> {
  const reader: ReadableStreamDefaultReader<T> = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}