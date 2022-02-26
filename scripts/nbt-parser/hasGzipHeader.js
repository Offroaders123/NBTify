export default function hasGzipHeader(data){
  const head = new Uint8Array(data.slice(0,2));
  return (head.length === 2 && head[0] === 0x1f && head[1] === 0x8b);
}