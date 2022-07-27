import { TypedArray } from "./TypedArray";

export function compress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;
export function decompress(data: ArrayBuffer | TypedArray,{ encoding } : { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;
// @ts-ignore
declare function pipeThrough(data: ArrayBuffer | TypedArray,stream: CompressionStream | DecompressionStream): Promise<ArrayBuffer | TypedArray>;