export * from "./read.js";
export * from "./write.js";
export * from "./compression.js";
export * from "./tags.js";

import { IntTag, CompoundTag } from "./tags.js";

export type Metadata = {
  name: string;
  endian: "big" | "little";
  compression: "none" | "gzip" | "zlib";
  bedrockLevel: false | IntTag;
};

export class NBTData implements Metadata {
  declare name;
  declare endian;
  declare compression;
  declare bedrockLevel;
  declare readonly data;

  constructor(data: CompoundTag, { name = "", endian = "big", compression = "none", bedrockLevel = false }: Partial<Metadata> = {}) {
    this.name = name;
    this.endian = endian;
    this.compression = compression;
    this.bedrockLevel = bedrockLevel;
    this.data = data;

    Object.defineProperty(this,"data",{
      configurable: false,
      enumerable: true,
      writable: false
    });
  }
}