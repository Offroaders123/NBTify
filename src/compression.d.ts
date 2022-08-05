import TypedArray from "./TypedArray";

export function compress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;
export function decompress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;