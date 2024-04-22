declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  interface CompressionStream {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<BufferSource>;
  }

  interface DecompressionStream {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<BufferSource>;
  }

  interface ReadableStream<R> {
    [Symbol.asyncIterator]?(): AsyncGenerator<R>;
  }
}

export {};