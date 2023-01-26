import { NBTData } from "./data.js";
import { Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getTagType } from "./tag.js";

export class NBTStringifier {
  stringify(data: CompoundTag | NBTData) {}

  #writeTag(value: Tag) {
    const type = getTagType(value);
    switch (type){}
  }

  #writeByte(value: number) {
    return `${value}b`;
  }
  
  #writeShort(value: number) {
    return `${value}s`;
  }

  #writeInt(value: number) {
    return `${value}`;
  }

  #writeLong(value: bigint) {
    return `${value}l`;
  }

  #writeFloat(value: number) {
    return `${value}f`;
  }

  #writeDouble(value: number) {
    return `${value}d`;
  }

  #writeByteArray(value: Int8Array) {
    return `[B;${[...value].map(this.#writeByte)}]`;
  }

  #writeString(value: string) {}

  #writeList(value: ListTag) {}

  #writeCompound(value: CompoundTag) {}

  #writeIntArray(value: Int32Array) {}

  #writeLongArray(value: BigInt64Array) {}
}