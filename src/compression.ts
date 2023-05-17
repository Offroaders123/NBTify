export async function gzip(data: BufferSource): Promise<Uint8Array> {
  return compress(data,"gzip");
}

export async function gunzip(data: BufferSource): Promise<Uint8Array> {
  return decompress(data,"gzip");
}

export async function deflate(data: BufferSource): Promise<Uint8Array> {
  return compress(data,"deflate");
}

export async function inflate(data: BufferSource): Promise<Uint8Array> {
  return decompress(data,"deflate");
}

export async function deflateRaw(data: BufferSource): Promise<Uint8Array> {
  return compress(data,"deflate-raw");
}

export async function inflateRaw(data: BufferSource): Promise<Uint8Array> {
  return decompress(data,"deflate-raw");
}

async function compress(data: BufferSource, format: CompressionFormat): Promise<Uint8Array> {
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data,compressionStream);
}

async function decompress(data: BufferSource, format: CompressionFormat): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data,decompressionStream);
}

async function pipeThroughCompressionStream(data: BufferSource, compressionStream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
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