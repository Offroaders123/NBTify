import TypedArray from "./TypedArray";

export declare function compress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw"; }): Promise<ArrayBuffer | TypedArray>;
export declare function decompress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw"; }): Promise<ArrayBuffer | TypedArray>;