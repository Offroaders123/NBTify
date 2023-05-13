// https://riptutorial.com/javascript/example/32392/iterating-through-an-arraybuffer
// https://stackoverflow.com/questions/71673883/how-to-convert-an-arraybuffer-to-readablestream-in-typescript

// $ tsx --watch ./this-file.mts

declare global {
  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncGenerator<R>;
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

/**
 * The raw bytes from the `hello_world.nbt` demo file.
*/
export const helloWorld = new Uint8Array([
  10,   0,  11, 104, 101, 108, 108, 111,
  32, 119, 111, 114, 108, 100,   8,   0,
   4, 110,  97, 109, 101,   0,   9,  66,
  97, 110,  97, 110, 114,  97, 109,  97,
   0
]);
console.log(helloWorld);

const readable = new ReadableStream<Uint8Array>({
  start(controller) {
    controller.enqueue(helloWorld);
    controller.close();
  },
});

for await (const chunk of readable){
  console.log(chunk);
}