import { NBTData } from "./format.js";
import { TAG, isTag, getTagType } from "./tag.js";
import { Int8, Int32 } from "./primitive.js";

import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface StringifyOptions {
  space?: string | number;
}

/**
 * Converts an NBTData object into an SNBT string.
*/
export function stringify<T extends RootTagLike>(data: T | NBTData<T>, options?: StringifyOptions): string;
export function stringify<T extends RootTagLike>(data: T | NBTData<T>, { space = "" }: StringifyOptions = {}): string {
  if (data instanceof NBTData){
    data = data.data;
  }

  if (typeof data !== "object" || data === null){
    throw new TypeError("First parameter must be an object or array");
  }
  if (typeof space !== "string" && typeof space !== "number"){
    throw new TypeError("Space option must be a string or number");
  }

  return new SNBTWriter().write(data,{ space });
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
  write<T extends RootTagLike>(data: T | NBTData<T>, options?: SNBTWriterOptions): string;
  write<T extends RootTagLike>(data: T | NBTData<T>, { space = "" }: SNBTWriterOptions = {}): string {
    if (data instanceof NBTData){
      data = data.data;
    }

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object or array");
    }
    if (typeof space !== "string" && typeof space !== "number"){
      throw new TypeError("Space option must be a string or number");
    }

    this.#space = (typeof space === "number") ? " ".repeat(space) : space;
    this.#level = 1;

    return this.#writeRoot(data as RootTag);
  }

  #writeRoot(value: RootTag): string {
    const type = getTagType(value);
    if (type !== TAG.LIST && type !== TAG.COMPOUND){
      throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
    }

    switch (type){
      case 9: return this.#writeList(value as ListTag<Tag>);
      case 10: return this.#writeCompound(value as CompoundTag);
    }
  }

  #writeTag(value: Tag): string {
    const type = getTagType(value);
    switch (type){
      case TAG.BYTE: return this.#writeByte(value as ByteTag | BooleanTag);
      case TAG.SHORT: return this.#writeShort(value as ShortTag);
      case TAG.INT: return this.#writeInt(value as IntTag);
      case TAG.LONG: return this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat(value as FloatTag);
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTag<Tag>);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag);
      default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
  }

  #writeByte(value: ByteTag | BooleanTag): string {
    return (typeof value === "boolean") ? `${value}` : `${value.valueOf()}b`;
  }

  #writeShort(value: ShortTag): string {
    return `${value.valueOf()}s`;
  }

  #writeInt(value: IntTag): string {
    return `${value.valueOf()}`;
  }

  #writeLong(value: LongTag): string {
    return `${value}l`;
  }

  #writeFloat(value: FloatTag): string {
    return `${value.valueOf()}f`;
  }

  #writeDouble(value: DoubleTag): string {
    return `${value}d`;
  }

  #writeByteArray(value: ByteArrayTag): string {
    return `[B;${[...value].map(entry => this.#writeByte(new Int8(entry))).join() satisfies string}]`;
  }

  #writeString(value: StringTag): string {
    const singleQuoteString = this.#escapeString(value.replace(/['\\]/g,character => `\\${character}`));
    const doubleQuoteString = this.#escapeString(value.replace(/["\\]/g,character => `\\${character}`));
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
  }

  #escapeString(value: StringTag): string {
    return value
      .replaceAll("\b","\\b")
      .replaceAll("\f","\\f")
      .replaceAll("\n","\\n")
      .replaceAll("\r","\\r")
      .replaceAll("\t","\\t");
  }

  #writeList(value: ListTag<Tag>): string {
    value = value.filter(isTag);
    const fancy = (this.#space !== "");
    const type: TAG = (value[0] !== undefined) ? getTagType(value[0]) : TAG.END;
    const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${this.#space.repeat(this.#level)}` : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(entry);
      this.#level -= 1;
      return result;
    })() satisfies string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${this.#space.repeat(this.#level - 1)}` : ""}]`;
  }

  #writeCompound(value: CompoundTag): string {
    const fancy = (this.#space !== "");
    return `{${Object.entries(value).filter((entry): entry is [string,Tag] => isTag(entry[1])).map(([key,value]) => `${fancy ? `\n${(this.#space satisfies string).repeat(this.#level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : this.#writeString(key)}:${fancy ? " " : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(value);
      this.#level -= 1;
      return result;
    })() satisfies string}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${this.#space.repeat(this.#level - 1)}` : ""}}`;
  }

  #writeIntArray(value: IntArrayTag): string {
    return `[I;${[...value].map(entry => this.#writeInt(new Int32(entry))).join() satisfies string}]`;
  }

  #writeLongArray(value: LongArrayTag): string {
    return `[L;${[...value].map(entry => this.#writeLong(entry)).join() satisfies string}]`;
  }
}