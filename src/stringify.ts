import { NBTData } from "./format.js";
import { TAG, getTagType, fromListUnsafe, fromCompoundUnsafe } from "./tag.js";
import { Int8, Int32 } from "./primitive.js";

import type { RootTag, Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, ListTagUnsafe, CompoundTag, CompoundTagUnsafe, IntArrayTag, LongArrayTag } from "./tag.js";

export interface StringifyOptions {
  space?: string | number;
}

/**
 * Converts an NBTData object into an SNBT string.
*/
export function stringify(data: RootTag | NBTData, options?: StringifyOptions): string;
export function stringify(data: RootTag | NBTData, { space = "" }: StringifyOptions = {}): string {
  if (data instanceof NBTData){
    data = data.data as RootTag;
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
  write(data: RootTag | NBTData, options?: SNBTWriterOptions): string;
  write(data: RootTag | NBTData, { space = "" }: SNBTWriterOptions = {}): string {
    if (data instanceof NBTData){
      data = data.data as RootTag;
    }

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object or array");
    }
    if (typeof space !== "string" && typeof space !== "number"){
      throw new TypeError("Space option must be a string or number");
    }

    this.#space = (typeof space === "number") ? " ".repeat(space) : space;
    this.#level = 1;

    return this.#writeRoot(data);
  }

  #writeRoot(value: RootTag): string {
    const type = getTagType(value);
    if (type !== TAG.LIST && type !== TAG.COMPOUND){
      throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
    }

    switch (type){
      case 9: return this.#writeList(fromListUnsafe(value as ListTagUnsafe<Tag>));
      case 10: return this.#writeCompound(fromCompoundUnsafe(value as CompoundTagUnsafe));
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
      case TAG.LIST: return this.#writeList(fromListUnsafe(value as ListTagUnsafe<Tag>));
      case TAG.COMPOUND: return this.#writeCompound(fromCompoundUnsafe(value as CompoundTagUnsafe));
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
    const singleQuoteString = value.replace(/['\\]/g,character => `\\${character}`);
    const doubleQuoteString = value.replace(/["\\]/g,character => `\\${character}`);
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
  }

  #writeList(value: ListTag<Tag>): string {
    const fancy = (this.#space !== "");
    const type = (value.length !== 0) ? getTagType(value[0])! : TAG.END;
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
    return `{${Object.entries(value).map(([key,value]) => `${fancy ? `\n${(this.#space satisfies string).repeat(this.#level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : this.#writeString(key)}:${fancy ? " " : ""}${(() => {
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