import { NBTData } from "./data.js";
import { Tag, ListTag, CompoundTag, TAG, getTagType } from "./tag.js";

export interface DefinitionOptions {
  name?: string;
}

/**
 * Generates a TypeScript interface definition from an NBTData object.
*/
export function definition(data: CompoundTag | NBTData, { name = "" }: DefinitionOptions = {}){
  if (data instanceof NBTData){
    data = data.data as CompoundTag;
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
  name?: string;
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
  write(data: CompoundTag | NBTData, { name = "" }: DefinitionWriterOptions = {}) {
    if (data instanceof NBTData){
      data = data.data as CompoundTag;
    }

    if (typeof data !== "object" || data === null){
      throw new TypeError("First parameter must be an object");
    }
    if (typeof name !== "string"){
      throw new TypeError("Name option must be a string");
    }

    this.#space = "  ";
    this.#level = 1;

    return `interface ${name} ${this.#writeTag(data)}`;
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
      case TAG.LIST: return this.#writeList(value as ListTag);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag);
      case TAG.INT_ARRAY: return this.#writeIntArray();
      case TAG.LONG_ARRAY: return this.#writeLongArray();
      default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
  }

  #writeBoolean() {
    return "BooleanTag" as const;
  }

  #writeByte() {
    return "ByteTag" as const;
  }

  #writeShort() {
    return "ShortTag" as const;
  }

  #writeInt() {
    return "IntTag" as const;
  }

  #writeLong() {
    return "LongTag" as const;
  }

  #writeFloat() {
    return "FloatTag" as const;
  }

  #writeDouble() {
    return "DoubleTag" as const;
  }

  #writeByteArray() {
    return "ByteArrayTag" as const;
  }

  #writeString() {
    return "StringTag" as const;
  }

  #writeStringLiteral(value: string) {
    const singleQuoteString = value.replace(/['\\]/g,(character) => `\\${character}`);
    const doubleQuoteString = value.replace(/["\\]/g,(character) => `\\${character}`);
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
  }

  #writeList(value: ListTag) {
    const fancy = (this.#space !== "");
    value = value.filter((entry): entry is Tag => getTagType(entry) !== null);
    const type = (value.length !== 0) ? getTagType(value[0])! : TAG.END;
    const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${this.#space.repeat(this.#level)}` : ""}${(() => {
      this.#level += 1;
      const result = this.#writeTag(entry);
      this.#level -= 1;
      return result;
    })() as string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${this.#space.repeat(this.#level - 1)}` : ""}]`;
  }

  #writeCompound(value: CompoundTag) {
    const fancy = (this.#space !== "");
    return `{${[...Object.entries(value)].filter(
      ([,value]): boolean => getTagType(value) !== null
    ).map(([key,value]) => `${fancy ? `\n${(this.#space as string).repeat(this.#level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : this.#writeStringLiteral(key)}:${fancy ? " " : ""}${(() => {
      this.#level += 1;
      const result = `${this.#writeTag(value)};`;
      this.#level -= 1;
      return result;
    })() as string}`).join("")}${fancy && Object.keys(value).length !== 0 ? `\n${this.#space.repeat(this.#level - 1)}` : ""}}`;
  }

  #writeIntArray() {
    return "IntArrayTag" as const;
  }

  #writeLongArray() {
    return "LongArrayTag" as const;
  }
}