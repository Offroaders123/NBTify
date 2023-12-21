import type { RootTag, RootTagLike } from "./tag.js";

export type RootName = string | null;
export type Endian = "big" | "little";
export type Compression = CompressionFormat | null;
export type BedrockLevel = number | null;

export interface Format {
  rootName: RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
}

export interface NBTDataOptions extends Partial<Format> {}

/**
 * An object which represents a set of NBT data.
*/
export class NBTData<T extends RootTagLike = RootTag> implements Format {
  declare readonly data: T;
  declare readonly rootName: RootName;
  declare readonly endian: Endian;
  declare readonly compression: Compression;
  declare readonly bedrockLevel: BedrockLevel;

  constructor(data: T | NBTData<T>, options?: NBTDataOptions);
  constructor(data: T | NBTData<T>, { rootName, endian, compression, bedrockLevel }: NBTDataOptions = {}) {
    if (data instanceof NBTData){
      if (rootName === undefined){
        rootName = data.rootName;
      }
      if (endian === undefined){
        endian = data.endian;
      }
      if (compression === undefined){
        compression = data.compression;
      }
      if (bedrockLevel === undefined){
        bedrockLevel = data.bedrockLevel;
      }
      data = data.data;
    }

    if (rootName === undefined){
      rootName = "";
    }
    if (endian === undefined){
      endian = "big";
    }
    if (compression === undefined){
      compression = null;
    }
    if (bedrockLevel === undefined){
      bedrockLevel = null;
    }

    if (typeof data !== "object" || data === null){
      data satisfies never;
      throw new TypeError("First parameter must be an object or array");
    }
    if (typeof rootName !== "string" && rootName !== null){
      rootName satisfies never;
      throw new TypeError("Root Name option must be a string or null");
    }
    if (endian !== "big" && endian !== "little"){
      endian satisfies never;
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
      compression satisfies never;
      throw new TypeError("Compression option must be a valid compression type");
    }
    if (typeof bedrockLevel !== "number" && bedrockLevel !== null){
      bedrockLevel satisfies never;
      throw new TypeError("Bedrock Level option must be a number or null");
    }

    Object.defineProperty(this,"data",{
      configurable: true,
      enumerable: true,
      writable: false,
      value: data
    });

    Object.defineProperty(this,"rootName",{
      configurable: true,
      enumerable: true,
      writable: false,
      value: rootName
    });

    Object.defineProperty(this,"endian",{
      configurable: true,
      enumerable: true,
      writable: false,
      value: endian
    });

    Object.defineProperty(this,"compression",{
      configurable: true,
      enumerable: (compression !== null),
      writable: false,
      value: compression
    });

    Object.defineProperty(this,"bedrockLevel",{
      configurable: true,
      enumerable: (bedrockLevel !== null),
      writable: false,
      value: bedrockLevel
    });
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}