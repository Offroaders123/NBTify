import { NBTData } from "./data.js";
import { TAG, getTagType, sanitizeList, sanitizeCompound } from "./tag.js";

import type { RootTag, Tag, ListTag, ListTagUnsafe, CompoundTag, CompoundTagUnsafe } from "./tag.js";

export interface DefinitionOptions {
  name: string;
}

/**
 * Generates a TypeScript interface definition from an NBTData object.
*/
export function definition(data: RootTag | NBTData, { name }: DefinitionOptions): string {
  if (data instanceof NBTData){
    data = data.data as CompoundTagUnsafe;
  }

  if (typeof data !== "object" || data === null){
    throw new TypeError("First parameter must be an object");
  }
  if (typeof name !== "string"){
    throw new TypeError("Name option must be a string");
  }

  const writer = new DefinitionWriter();
  return writer.write(data,{ name });
}

export interface DefinitionWriterOptions {
  name: string;
}

/**
 * The base implementation to generate a TypeScript interface definition from an NBTData object.
*/
export class DefinitionWriter {
  #space!: string;
  #level!: number;

  /**
   * Initiates the writer over an NBTData object.
  */
  write(data: RootTag | NBTData, { name }: DefinitionWriterOptions): string {
    if (data instanceof NBTData){
      data = data.data as CompoundTagUnsafe;
    }

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object");
    }
    if (typeof name !== "string"){
      throw new TypeError("Name option must be a string");
    }

    this.#space = "  ";
    this.#level = 1;

    return `interface ${name} ${this.#writeCompoundUnsafe(data as CompoundTagUnsafe)}`;
  }

  #writeTag(value: Tag): string {
    const type = getTagType(value);
    switch (type){
      case TAG.BYTE: return (typeof value === "boolean") ? this.#writeBoolean() : this.#writeByte();
      case TAG.SHORT: return this.#writeShort();
      case TAG.INT: return this.#writeInt();
      case TAG.LONG: return this.#writeLong();
      case TAG.FLOAT: return this.#writeFloat();
      case TAG.DOUBLE: return this.#writeDouble();
      case TAG.BYTE_ARRAY: return this.#writeByteArray();
      case TAG.STRING: return this.#writeString();
      case TAG.LIST: return this.#writeListUnsafe(value as ListTagUnsafe);
      case TAG.COMPOUND: return this.#writeCompoundUnsafe(value as CompoundTagUnsafe);
      case TAG.INT_ARRAY: return this.#writeIntArray();
      case TAG.LONG_ARRAY: return this.#writeLongArray();
      default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
  }

  #writeBoolean(): string {
    return "BooleanTag";
  }

  #writeByte(): string {
    return "ByteTag";
  }

  #writeShort(): string {
    return "ShortTag";
  }

  #writeInt(): string {
    return "IntTag";
  }

  #writeLong(): string {
    return "LongTag";
  }

  #writeFloat(): string {
    return "FloatTag";
  }

  #writeDouble(): string {
    return "DoubleTag";
  }

  #writeByteArray(): string {
    return "ByteArrayTag";
  }

  #writeString(): string {
    return "StringTag";
  }

  #writeStringLiteral(value: string): string {
    const singleQuoteString = value.replace(/['\\]/g,(character) => `\\${character}`);
    const doubleQuoteString = value.replace(/["\\]/g,(character) => `\\${character}`);
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
  }

  #writeList(value: ListTag): string {
    const fancy = (this.#space !== "");
    const type = (value.length !== 0) ? getTagType(value[0])! : TAG.END;
    const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${this.#space.repeat(this.#level)}` : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(entry);
      this.#level -= 1;
      return result;
    })() as string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${this.#space.repeat(this.#level - 1)}` : ""}]`;
  }

  #writeListUnsafe(value: ListTagUnsafe): string {
    return this.#writeList(sanitizeList(value));
  }

  #writeCompound(value: CompoundTag): string {
    const fancy = (this.#space !== "");
    return `{${Object.entries(value).map(([key,value]) => `${fancy ? `\n${(this.#space as string).repeat(this.#level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : this.#writeStringLiteral(key)}:${fancy ? " " : ""}${(() => {
      this.#level += 1;
      const result = `${this.#writeTag(value)};`;
      this.#level -= 1;
      return result;
    })() as string}`).join("")}${fancy && Object.keys(value).length !== 0 ? `\n${this.#space.repeat(this.#level - 1)}` : ""}}`;
  }

  #writeCompoundUnsafe(value: CompoundTagUnsafe): string {
    return this.#writeCompound(sanitizeCompound(value));
  }

  #writeIntArray(): string {
    return "IntArrayTag";
  }

  #writeLongArray(): string {
    return "LongArrayTag";
  }
}