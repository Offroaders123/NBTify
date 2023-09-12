import { Int32 } from "./primitive.js";

import type { RootTagLike } from "./tag.js";

export type Name = string | null;
export type Endian = "big" | "little";
export type Compression = CompressionFormat | null;
export type BedrockLevel = Int32 | null;

export interface FormatOptions {
  name?: Name;
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: BedrockLevel;
}

type FormatProperty<T extends FormatOptions, U extends keyof FormatOptions> = T[U] extends null | {} ? T[U] : Exclude<FormatOptions[U],undefined>;

/**
 * An object which represents a set of NBT data.
*/
export class NBTData<T extends RootTagLike = RootTagLike, const U extends FormatOptions = FormatOptions> {
  declare readonly data: T;
  declare readonly name: FormatProperty<U,"name">;
  declare readonly endian: FormatProperty<U,"endian">;
  declare readonly compression: FormatProperty<U,"compression">;
  declare readonly bedrockLevel: FormatProperty<U,"bedrockLevel">;

  constructor(data: T | NBTData<T>, options?: U);
  constructor(data: T | NBTData<T>, { name, endian, compression, bedrockLevel }: U = {} as U) {
    if (data instanceof NBTData){
      if (name === undefined) name = data.name;
      if (endian === undefined) endian = data.endian;
      if (compression === undefined) compression = data.compression;
      if (bedrockLevel === undefined) bedrockLevel = data.bedrockLevel;
      data = data.data;
    }

    if (name === undefined) name = "";
    if (endian === undefined) endian = "big";
    if (compression === undefined) compression = null;
    if (bedrockLevel === undefined) bedrockLevel = null;

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object or array");
    }
    if (typeof name !== "string" && name !== null){
      throw new TypeError("Name option must be a string or null");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
      throw new TypeError("Compression option must be a valid compression type");
    }
    if (!(bedrockLevel instanceof Int32) && bedrockLevel !== null){
      throw new TypeError("Bedrock Level option must be an Int32 or null");
    }

    Object.defineProperty(this,"data",{
      configurable: true,
      enumerable: true,
      value: data
    });

    Object.defineProperty(this,"name",{
      configurable: true,
      enumerable: true,
      value: name
    });

    Object.defineProperty(this,"endian",{
      configurable: true,
      enumerable: true,
      value: endian
    });

    Object.defineProperty(this,"compression",{
      configurable: true,
      enumerable: (compression !== null),
      value: compression
    });

    Object.defineProperty(this,"bedrockLevel",{
      configurable: true,
      enumerable: (bedrockLevel !== null),
      value: bedrockLevel
    });
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}