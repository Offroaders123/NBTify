// https://www.jasnell.me/posts/webstreams

export const helloWorld = new Uint8Array([
  10,   0,  11, 104, 101, 108, 108, 111,
  32, 119, 111, 114, 108, 100,   8,   0,
   4, 110,  97, 109, 101,   0,   9,  66,
  97, 110,  97, 110, 114,  97, 109,  97,
   0
]);

await readNBT(helloWorld);

export async function readNBT(data: Uint8Array | ReadableStream<Uint8Array>){
  if (data instanceof Uint8Array){
    data = new Blob([data]).stream();
  }
  console.log(data);

  const reader = data.getReader();

  while (true){
    const { done, value } = await reader.read();
    if (done) break;
    console.log(value);
  }
}

declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }
}