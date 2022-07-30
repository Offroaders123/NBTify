/** @type { import("../types/index").compress } */
export async function compress(data,{ encoding } = {}){
  const stream = new CompressionStream(encoding);
  return await pipeThrough(data,stream);
}

/** @type { import("../types/index").decompress } */
export async function decompress(data,{ encoding } = {}){
  const stream = new DecompressionStream(encoding);
  return await pipeThrough(data,stream);
}

async function pipeThrough(data,stream){
  const writable = stream.writable.getWriter();
  writable.write(data);
  writable.close();
  const { readable } = stream;
  const result = await new Response(readable).arrayBuffer();
  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}