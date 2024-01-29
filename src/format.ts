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
  data: T;
  rootName: RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;

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

    return new Proxy(this,{
      set<K extends keyof NBTData<T>>(target: NBTData<T>, property: keyof NBTData<T>, value: NBTData<T>[K]): boolean {
        switch (property){
          case "data": isRootTagLike(value); break;
          case "rootName": isRootName(value); break;
          case "endian": isEndian(value); break;
          case "compression": isCompression(value); break;
          case "bedrockLevel": isBedrockLevel(value); break;
        }
        // @ts-expect-error
        target[property] = value;
        return true;
      }
    });
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}


export function isRootTagLike(data: unknown): asserts data is RootTagLike {
  if (typeof data !== "object" || data === null){
    throw new TypeError("First parameter must be an object or array");
  }
  data satisfies RootTagLike;
}

export function isRootName(rootName: unknown): asserts rootName is RootName {
  if (typeof rootName !== "string" && rootName !== null){
    throw new TypeError("Root Name option must be a string or null");
  }
  rootName satisfies RootName;
}

export function isEndian(endian: unknown): asserts endian is Endian {
  if (endian !== "big" && endian !== "little"){
    throw new TypeError("Endian option must be a valid endian type");
  }
  endian satisfies Endian;
}

export function isCompression(compression: unknown): asserts compression is Compression {
  if (compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
    throw new TypeError("Compression option must be a valid compression type");
  }
  compression satisfies Compression;
}

export function isBedrockLevel(bedrockLevel: unknown): asserts bedrockLevel is BedrockLevel {
  if (typeof bedrockLevel !== "number" && bedrockLevel !== null){
    throw new TypeError("Bedrock Level option must be a number or null");
  }
  bedrockLevel satisfies BedrockLevel;
}