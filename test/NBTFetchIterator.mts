declare global {
  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncGenerator<R>;
  }

  class DecompressionStream extends TransformStream<BufferSource,Uint8Array> {
    constructor(format: "gzip" | "deflate" | "deflate-raw");
  }
}

const simpleHouse = "https://github.com/Offroaders123/NBTify/blob/main/test/nbt/simple_house.nbt?raw=true";
const response = await fetch(simpleHouse);

await readNBT(response.body!);

async function readNBT(stream: ReadableStream<Uint8Array>){
  stream = stream.pipeThrough(new DecompressionStream("gzip"));

  for await (const chunk of stream){
    console.log(chunk);
  }
}