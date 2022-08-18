declare global {
  class CompressionStream {
    constructor(format: string);

    readonly readable: ReadableStream<BufferSource>;
    readonly writable: WritableStream<Uint8Array>;
  }

  class DecompressionStream {
    constructor(format: string);

    readonly readable: ReadableStream<BufferSource>;
    readonly writable: WritableStream<Uint8Array>;
  }
}

export {};