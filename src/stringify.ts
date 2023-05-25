import { NBTData } from "./data.js";
import { TAG, getTagType } from "./tag.js";

import type { RootTag, Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, ListTagUnsafe, CompoundTag, CompoundTagUnsafe, IntArrayTag, LongArrayTag } from "./tag.js";

export interface StringifyOptions {
  space?: string | number;
}

/**
 * Converts an NBTData object into an SNBT string.
*/
export function stringify(data: RootTag | NBTData, { space = "" }: StringifyOptions = {}): string {
  if (data instanceof NBTData){
    data = data.data as CompoundTagUnsafe;
  }

  if (typeof data !== "object" || data === null){
    throw new TypeError("First parameter must be an object");
  }
  if (typeof space !== "string" && typeof space !== "number"){
    throw new TypeError("Space option must be a string or number");
  }

  const writer = new SNBTWriter();
  return writer.write(data,{ space });
}

export interface SNBTWriterOptions {
  space?: string | number;
}

/**
 * The base implementation to convert an NBTData object into an SNBT string.
*/
export class SNBTWriter {
  #space!: string;
  #level!: number;

  /**
   * Initiates the writer over an NBTData object.
  */
  write(data: RootTag | NBTData, { space = "" }: SNBTWriterOptions = {}): string {
    if (data instanceof NBTData){
      data = data.data as CompoundTagUnsafe;
    }

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object");
    }
    if (typeof space !== "string" && typeof space !== "number"){
      throw new TypeError("Space option must be a string or number");
    }

    this.#space = (typeof space === "number") ? " ".repeat(space) : space;
    this.#level = 1;

    return this.#writeCompound(data as CompoundTagUnsafe);
  }

  #writeTag(value: Tag): string {
    const type = getTagType(value);
    switch (type){
      case TAG.BYTE: return (typeof value === "boolean") ? this.#writeBoolean(value as boolean) : this.#writeByte(value as ByteTag);
      case TAG.SHORT: return this.#writeShort(value as ShortTag);
      case TAG.INT: return this.#writeInt(value as IntTag);
      case TAG.LONG: return this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat(value as FloatTag);
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTagUnsafe);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTagUnsafe);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag);
      default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
  }

  #writeBoolean(value: boolean) {
    return `${value}` as const;
  }

  #writeByte(value: number | ByteTag) {
    return `${value.valueOf()}b` as const;
  }

  #writeShort(value: number | ShortTag) {
    return `${value.valueOf()}s` as const;
  }

  #writeInt(value: number | IntTag) {
    return `${value.valueOf()}` as const;
  }

  #writeLong(value: LongTag) {
    return `${value}l` as const;
  }

  #writeFloat(value: number | FloatTag) {
    return `${value.valueOf()}f` as const;
  }

  #writeDouble(value: DoubleTag) {
    return `${value}d` as const;
  }

  #writeByteArray(value: ByteArrayTag): string {
    return `[B;${[...value].map(entry => this.#writeByte(entry)).join() as string}]`;
  }

  #writeString(value: StringTag): string {
    const singleQuoteString = value.replace(/['\\]/g,(character) => `\\${character}`);
    const doubleQuoteString = value.replace(/["\\]/g,(character) => `\\${character}`);
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
  }

  #writeList(valueUnsafe: ListTagUnsafe): string {
    const fancy = (this.#space !== "");
    const value = valueUnsafe.filter((entry): entry is Tag => getTagType(entry) !== null);
    const type = (value.length !== 0) ? getTagType(value[0])! : TAG.END;
    const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${this.#space.repeat(this.#level)}` : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(entry);
      this.#level -= 1;
      return result;
    })() as string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${this.#space.repeat(this.#level - 1)}` : ""}]`;
  }

  #writeCompound(valueUnsafe: CompoundTagUnsafe): string {
    const fancy = (this.#space !== "");
    return `{${[...Object.entries(valueUnsafe)].filter(
      (entry): entry is [string,Tag] => getTagType(entry[1]) !== null
    ).map(([key,value]) => `${fancy ? `\n${(this.#space as string).repeat(this.#level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : this.#writeString(key)}:${fancy ? " " : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(value);
      this.#level -= 1;
      return result;
    })() as string}`).join(",")}${fancy && Object.keys(valueUnsafe).length !== 0 ? `\n${this.#space.repeat(this.#level - 1)}` : ""}}`;
  }

  #writeIntArray(value: IntArrayTag): string {
    return `[I;${[...value].map(entry => this.#writeInt(entry)).join() as string}]`;
  }

  #writeLongArray(value: LongArrayTag): string {
    return `[L;${[...value].map(entry => this.#writeLong(entry)).join() as string}]`;
  }
}