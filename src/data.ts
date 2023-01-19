import type { CompoundTag } from "./tag.js";
import { Int } from "./primitive.js";

export type Name = string | null;
export type Endian = "big" | "little";
export type Compression = "gzip" | "deflate";
export type BedrockLevel = Int;

export interface NBTDataOptions {
  name?: Name;
  endian?: Endian;
  compression?: Compression | null;
  bedrockLevel?: BedrockLevel | null;
}

/**
 * An object which represents a set of NBT data.
*/
export class NBTData {
  declare readonly data: any;
  declare readonly name: Name;
  declare readonly endian: Endian;
  declare readonly compression?: Compression;
  declare readonly bedrockLevel?: BedrockLevel;

  constructor(data: object | NBTData, { name, endian, compression, bedrockLevel }: NBTDataOptions = {}) {
    if (data instanceof NBTData){
      if (name === undefined) name = data.name;
      if (endian === undefined) endian = data.endian;
      if (compression === undefined) compression = data.compression;
      if (bedrockLevel === undefined) bedrockLevel = data.bedrockLevel;
      data = data.data as object;
    }

    if (name === undefined) name = "";
    if (endian === undefined) endian = "big";
    if (compression === undefined) compression = null;
    if (bedrockLevel === undefined) bedrockLevel = null;

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object");
    }
    if (typeof name !== "string" && name !== null){
      throw new TypeError("Name option must be a string or null");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError("Endian option must be a valid endian type");
    }
    if (compression !== null && compression !== "gzip" && compression !== "deflate"){
      throw new TypeError("Compression option must be a valid compression type");
    }
    if (bedrockLevel !== null && !(bedrockLevel instanceof Int)){
      throw new TypeError("Bedrock Level option must be an Int");
    }

    this.data = data as CompoundTag;
    this.name = name;
    this.endian = endian;
    if (compression !== null) this.compression = compression;
    if (bedrockLevel !== null) this.bedrockLevel = bedrockLevel;

    Object.freeze(this);
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}