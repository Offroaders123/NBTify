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

  constructor(data: T | NBTData<T>, options: NBTDataOptions = {}) {
    if (data instanceof NBTData){
      if (options.rootName === undefined){
        options.rootName = data.rootName;
      }
      if (options.endian === undefined){
        options.endian = data.endian;
      }
      if (options.compression === undefined){
        options.compression = data.compression;
      }
      if (options.bedrockLevel === undefined){
        options.bedrockLevel = data.bedrockLevel;
      }
      data = data.data;
    }

    const { rootName = "", endian = "big", compression = null, bedrockLevel = null } = options;

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

    Object.defineProperty(this,"data" satisfies keyof NBTData,{
      configurable: true,
      enumerable: true,
      writable: false,
      value: data
    });

    Object.defineProperty(this,"rootName" satisfies keyof NBTData,{
      configurable: true,
      enumerable: true,
      writable: false,
      value: rootName
    });

    Object.defineProperty(this,"endian" satisfies keyof NBTData,{
      configurable: true,
      enumerable: true,
      writable: false,
      value: endian
    });

    Object.defineProperty(this,"compression" satisfies keyof NBTData,{
      configurable: true,
      enumerable: (compression !== null),
      writable: false,
      value: compression
    });

    Object.defineProperty(this,"bedrockLevel" satisfies keyof NBTData,{
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