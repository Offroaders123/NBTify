export function compress(data: Uint8Array, { encoding }: { encoding: "deflate" | "gzip"; }): Promise<Uint8Array>;

export function decompress(data: Uint8Array, { encoding }: { encoding: "deflate" | "gzip"; }): Promise<Uint8Array>;