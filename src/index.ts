export * from "./compression.js";
export * from "./primitive.js";
export * from "./read.js";
export * from "./tag.js";
export * from "./write.js";

import { Int } from "./primitive.js";
import { CompoundTag } from "./tag.js";

export type Data = CompoundTag | NBTData;
export type Name = string;
export type Endian = "big" | "little";
export type Compression = "gzip" | "zlib";
export type BedrockLevel = Int;

export interface NBTDataOptions {
  name?: Name;
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: BedrockLevel;
}

/**
 * An object which represents a set of NBT data.
*/
export class NBTData {
  // Mark these as readonly!
  declare data: CompoundTag;
  declare name: Name;
  declare endian: Endian;
  declare compression?: Compression;
  declare bedrockLevel?: BedrockLevel;

  constructor(data: Data, { name = "", endian = "big", compression, bedrockLevel }: NBTDataOptions = {}) {
    const value = (data instanceof NBTData) ? data.data : data;

    if (typeof value !== "object"){
      throw new TypeError("First parameter must be an object");
    }
    if (typeof name !== "string"){
      throw new TypeError("Name option must be a string");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (typeof compression !== "undefined" && compression !== "gzip" && compression !== "zlib"){
      throw new TypeError("Compression option must be a valid compression type");
    }
    if (typeof bedrockLevel !== "undefined" && !(bedrockLevel instanceof Int)){
      throw new TypeError("Bedrock level option must be an Int");
    }

    this.data = value;
    this.name = name;
    this.endian = endian;
    if (typeof compression !== "undefined") this.compression = compression;
    if (typeof bedrockLevel !== "undefined") this.bedrockLevel = bedrockLevel;

    // Object.freeze(this);
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}