// https://streams.spec.whatwg.org/#ts-model
// https://github.com/whatwg/streams/issues/1057
// https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream
// https://blog.risingstack.com/the-definitive-guide-to-object-streams-in-node-js/

// $ tsx --watch ./this-file.mts

export async function* asyncIterator(readable: ReadableStream){
  const reader = readable.getReader();
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

let buffer: ArrayBuffer;

const stream = new ReadableStream({
  type: "bytes",
  start(controller) {
    controller.enqueue(helloWorld);
  },
});
const reader = stream.getReader({ mode: "byob" });

readStream(reader);

async function readStream(reader: ReadableStreamBYOBReader){
  let bytesReceived = 0;
  let offset = 0;

  while (offset < buffer.byteLength){
    await reader
      .read(new Uint8Array(buffer,offset,buffer.byteLength - offset))
      .then(async function processBytes({ done, value }){
        if (done) return;

        buffer = value.buffer;
        offset += value.byteLength;
        bytesReceived += value.byteLength;

        return reader
          .read(new Uint8Array(buffer,offset,buffer.byteLength - offset))
          .then(processBytes);
      });
  }
}