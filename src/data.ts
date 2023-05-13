import { Int32 } from "./primitive.js";

export type NBT = object;
export type NBTLike<T extends NBT = any> = T | NBTData<T>;

export type Name = string | null;
export type Endian = "big" | "little";
export type Compression = "gzip" | "deflate" | null;
export type BedrockLevel = Int32 | null;

export interface NBTDataOptions {
  name?: Name;
  endian?: Endian;
  compression?: Compression;
  bedrockLevel?: BedrockLevel;
}

/**
 * An object which represents a set of NBT data.
*/
export class NBTData<T extends NBT = any> {
  declare readonly data: T;
  declare readonly name: Name;
  declare readonly endian: Endian;
  declare readonly compression: Compression;
  declare readonly bedrockLevel: BedrockLevel;

  constructor(data: NBTLike<T>, options: NBTDataOptions = {}) {
    let { name, endian, compression, bedrockLevel } = options;

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