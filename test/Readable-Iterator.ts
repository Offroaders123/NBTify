// https://jakearchibald.com/2017/async-iterators-and-generators/#making-streams-iterate
// https://github.com/whatwg/streams/issues/778
// https://bugs.chromium.org/p/chromium/issues/detail?id=929585
// https://riptutorial.com/javascript/example/32392/iterating-through-an-arraybuffer

declare global {
  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncGenerator<R>;
  }

  class DecompressionStream extends TransformStream {
    constructor(format: string);
  }
}

ReadableStream.prototype[Symbol.asyncIterator] = async function*(){
  const reader = this.getReader();
  try {
    while (true){
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
};

const HELLO_WORLD = "https://raw.github.com/Dav1dde/nbd/master/test/bigtest.nbt";
const response = await fetch(HELLO_WORLD);

for await (const chunk of response.body!.pipeThrough(new DecompressionStream("gzip"))){
  console.log(chunk);
}

export {};