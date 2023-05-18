declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  type CompressionFormat = "deflate" | "deflate-raw" | "gzip";

  interface CompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var CompressionStream: {
    new (format: CompressionFormat): CompressionStream;
    prototype: CompressionStream;
  };

  interface DecompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var DecompressionStream: {
    new (format: CompressionFormat): DecompressionStream;
    prototype: DecompressionStream;
  };
}

export {};