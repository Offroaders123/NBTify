export async function compress(data,{ encoding } = {}){
  const stream = new CompressionStream(encoding);
  return await writeStream(data,stream);
}

export async function decompress(data,{ encoding } = {}){
  const stream = new DecompressionStream(encoding);
  return await writeStream(data,stream);
}

async function writeStream(data,stream){
  const writable = stream.writable.getWriter();
  writable.write(data);
  writable.close();
  const result = await new Response(stream.readable).arrayBuffer();
  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}