import { Int32 } from "./primitive.js";

import type { RootTag, RootTagLike } from "./tag.js";

export type RootName = string | null;
export type Endian = "big" | "little";
export type Compression = CompressionFormat | null;
export type BedrockLevel = boolean;

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
  readonly data: T;
  readonly rootName: RootName;
  readonly endian: Endian;
  readonly compression: Compression;
  readonly bedrockLevel: BedrockLevel;

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

    const { rootName = "", endian = "big", compression = null, bedrockLevel = false } = options;

    isRootTagLike(data);
    isRootName(rootName);
    isEndian(endian);
    isCompression(compression);
    isBedrockLevel(bedrockLevel);

    this.data = data;
    this.rootName = rootName;
    this.endian = endian;
    this.compression = compression;
    this.bedrockLevel = bedrockLevel;

    if (this.bedrockLevel){
      if (this.endian !== "little"){
        throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
      }
      if (!("StorageVersion" in data) || !(data.StorageVersion instanceof Int32)){
        throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
      }
    }

    for (const property of ["data","rootName","endian","compression","bedrockLevel"] as (keyof NBTData)[]){
      let enumerable: boolean = true;

      switch (property){
        case "compression": enumerable = compression !== null; break;
        case "bedrockLevel": enumerable = bedrockLevel; break;
      }

      Object.defineProperty(this,property,{
        configurable: true,
        enumerable,
        writable: false
      });
    }
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}

export function isRootTagLike(data: unknown): asserts data is RootTagLike {
  if (typeof data !== "object" || data === null){
    throw new TypeError("Root Tag must be an object or array");
  }
  data satisfies RootTagLike;
}

export function isRootName(rootName: unknown): asserts rootName is RootName {
  if (typeof rootName !== "string" && rootName !== null){
    throw new TypeError("Root Name must be a string or null");
  }
  rootName satisfies RootName;
}

export function isEndian(endian: unknown): asserts endian is Endian {
  if (endian !== "big" && endian !== "little"){
    throw new TypeError("Endian must be 'big' or 'little'");
  }
  endian satisfies Endian;
}

export function isCompression(compression: unknown): asserts compression is Compression {
  if (compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
    throw new TypeError("Compression must be 'deflate', 'deflate-raw', 'gzip', or null");
  }
  compression satisfies Compression;
}

export function isBedrockLevel(bedrockLevel: unknown): asserts bedrockLevel is BedrockLevel {
  if (typeof bedrockLevel !== "boolean"){
    throw new TypeError("Bedrock Level must be a boolean");
  }
  bedrockLevel satisfies BedrockLevel;
}