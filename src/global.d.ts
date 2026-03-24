declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncGenerator<R>;
  }
}

export { };
