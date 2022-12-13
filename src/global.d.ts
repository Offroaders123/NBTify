declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  interface CompressionStream extends TransformStream<Uint8Array,BufferSource> {}

  interface CompressionStreamConstructor {
    new(format: string): CompressionStream;
  }

  var CompressionStream: CompressionStreamConstructor;

  interface DecompressionStream extends TransformStream<Uint8Array,BufferSource> {}

  interface DecompressionStreamConstructor {
    new(format: string): DecompressionStream;
  }

  var DecompressionStream: DecompressionStreamConstructor;
}

export {};