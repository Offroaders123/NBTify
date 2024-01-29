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
  #data!: typeof this.data;
  #rootName!: typeof this.rootName;
  #endian!: typeof this.endian;
  #compression!: typeof this.compression;
  #bedrockLevel!: typeof this.bedrockLevel;

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

    this.data = data;
    this.rootName = rootName;
    this.endian = endian;
    this.compression = compression;
    this.bedrockLevel = bedrockLevel;

    for (const property of ["data","rootName","endian","compression","bedrockLevel"]){
      const descriptor = Object.getOwnPropertyDescriptor(NBTData.prototype,property);
      Object.defineProperty(this,property,{ ...descriptor, enumerable: true });
    }
  }

  get data(): T {
    return this.#data;
  }

  set data(data) {
    if (typeof data !== "object" || data === null){
      data satisfies never;
      throw new TypeError("First parameter must be an object or array");
    }
    this.#data = data;
  }

  get rootName(): RootName {
    return this.#rootName;
  }

  set rootName(rootName) {
    if (typeof rootName !== "string" && rootName !== null){
      rootName satisfies never;
      throw new TypeError("Root Name option must be a string or null");
    }
    this.#rootName = rootName;
  }

  get endian(): Endian {
    return this.#endian;
  }

  set endian(endian) {
    if (endian !== "big" && endian !== "little"){
      endian satisfies never;
      throw new TypeError("Endian option must be a valid endian type");
    }
    this.#endian = endian;
  }

  get compression(): Compression {
    return this.#compression;
  }

  set compression(compression) {
    if (compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null){
      compression satisfies never;
      throw new TypeError("Compression option must be a valid compression type");
    }
    this.#compression = compression;
  }

  get bedrockLevel(): BedrockLevel {
    return this.#bedrockLevel;
  }

  set bedrockLevel(bedrockLevel) {
    if (typeof bedrockLevel !== "number" && bedrockLevel !== null){
      bedrockLevel satisfies never;
      throw new TypeError("Bedrock Level option must be a number or null");
    }
    this.#bedrockLevel = bedrockLevel;
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}