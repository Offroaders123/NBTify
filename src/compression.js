/** @type { import("./compression").compress } */
export async function compress(data,{ encoding }){
  // @ts-ignore
  const stream = new CompressionStream(encoding);
  return await pipeThrough(data,stream);
}

/** @type { import("./compression").decompress } */
export async function decompress(data,{ encoding }){
  // @ts-ignore
  const stream = new DecompressionStream(encoding);
  return await pipeThrough(data,stream);
}

/** @type { import("./compression").pipeThrough } */
async function pipeThrough(data,stream){
  const writable = stream.writable.getWriter();
  writable.write(data);
  writable.close();
  const { readable } = stream;
  const result = await new Response(readable).arrayBuffer();
  // @ts-ignore
  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}