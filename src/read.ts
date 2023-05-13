import { NBT, Name, Endian, Compression, BedrockLevel, NBTData } from "./data.js";

// export type FileLike = Uint8Array | ArrayBufferLike | Blob | ReadableStream<Uint8Array>;
export type FileLike = ReadableStream<Uint8Array>;

export interface ReadOptions {
  endian?: Endian;
  compression?: Compression;
  strict?: boolean;
  isNamed?: boolean;
  isBedrockLevel?: boolean;
}

export async function readNBT<T extends NBT = any>(data: FileLike, options: ReadOptions = {}): Promise<NBTData<T>> {
  const reader = data.pipeThrough(new DecompressionStream("gzip"));
  for await (const chunk of reader){
    console.log(chunk);
  }
}