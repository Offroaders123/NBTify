declare global {
  class CompressionStream extends TransformStream<Uint8Array,BufferSource> {
    constructor(format: string);
  }

  class DecompressionStream extends TransformStream<Uint8Array,BufferSource> {
    constructor(format: string);
  }
}

export {};