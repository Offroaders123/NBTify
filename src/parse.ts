import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";

import type { Tag, RootTag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export function parse<T extends RootTag = any>(data: string): T {
  return new SNBTReader().read<T>(data);
}

const TOKEN = {
  WHITESPACE: /\s+/
} as const;

Object.freeze(TOKEN);

export class SNBTReader {
  #data!: string;
  #index!: number;

  read<T extends RootTag = any>(data: string): T {
    this.#data = data;
    this.#index = 0;

    const tag = this.#readCompound() as T;
  }

  #allocate(length: number): void {
    if (this.#index + length > this.#data.length){
      throw new Error("Ran out of characters to read, unexpectedly reached the end of the string");
    }
  }

  #readCharacter(offset: number): string {
    return this.#data[this.#index + offset];
  }

  #readWhitespace(): void {
    while (true){
      this.#allocate(1);
      const value = this.#readCharacter(0);
      if (TOKEN.WHITESPACE.test(value)) break;
      this.#index += 1;
    }
  }

  #readTag(): Tag {}

  #readByte(): ByteTag {}

  #readShort(): ShortTag {}

  #readInt(): IntTag {}

  #readLong(): LongTag {}

  #readFloat(): FloatTag {}

  #readDouble(): DoubleTag {}

  #readByteArray(): ByteArrayTag {}

  #readString(): StringTag {}

  #readList(): ListTag {}

  #readCompound(): CompoundTag {}

  #readIntArray(): IntArrayTag {}

  #readLongArray(): LongArrayTag {}
}