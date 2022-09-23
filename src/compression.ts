type CompressionOptions = { format?: "gzip" | "deflate" | "deflate-raw" };

export async function compress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new CompressionStream(format);
  return await pipeThrough(data,stream);
}

export async function decompress(data: Uint8Array, { format = "gzip" }: CompressionOptions = {}){
  const stream = new DecompressionStream(format);
  return await pipeThrough(data,stream);
}

async function pipeThrough(data: Uint8Array, stream: TransformStream){
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const { readable } = stream;
  return new Uint8Array(await new Response(readable).arrayBuffer());
}