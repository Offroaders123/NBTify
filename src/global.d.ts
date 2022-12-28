declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  type CompressionFormat = "gzip" | "deflate" | "deflate-raw";

  interface CompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var CompressionStream: {
    prototype: CompressionStream;
    new(format: CompressionFormat): CompressionStream;
  };

  interface DecompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var DecompressionStream: {
    prototype: DecompressionStream;
    new(format: CompressionFormat): DecompressionStream;
  };
}

export {};