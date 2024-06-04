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
 * A container which maintains how a given NBT object is formatted.
*/
export class NBTData<T extends RootTagLike = RootTag> implements Format {
  data: T;
  rootName: RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;

  constructor(data: T | NBTData<T>, options: NBTDataOptions = {}) {
    if (data instanceof NBTData) {
      if (options.rootName === undefined) {
        options.rootName = data.rootName;
      }
      if (options.endian === undefined) {
        options.endian = data.endian;
      }
      if (options.compression === undefined) {
        options.compression = data.compression;
      }
      if (options.bedrockLevel === undefined) {
        options.bedrockLevel = data.bedrockLevel;
      }
      data = data.data;
    }

    const { rootName = "", endian = "big", compression = null, bedrockLevel = false } = options;

    this.data = data;
    this.rootName = rootName;
    this.endian = endian;
    this.compression = compression;
    this.bedrockLevel = bedrockLevel;
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}