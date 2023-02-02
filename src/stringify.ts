import { NBTData } from "./data.js";
import { Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getTagType } from "./tag.js";
import { Byte, Short, Int, Float } from "./primitive.js";

const UNQUOTED_STRING_PATTERN = /^[0-9a-z_\-.+]+$/i;

export function stringify(data: CompoundTag | NBTData, space: string | number = ""){
  if (data instanceof NBTData){
    data = data.data as CompoundTag;
  }
  const writer = new SNBTWriter();
  return writer.write(data,space);
}

export class SNBTWriter {
  write(data: CompoundTag | NBTData, space: string | number = ""): string {
    if (data instanceof NBTData){
      data = data.data as CompoundTag;
    }
    space = (typeof space === "number") ? " ".repeat(space) : space;
    return this.#writeTag(data,space);
  }

  #writeTag(value: Tag, space: string, level = 1): string {
    const type = getTagType(value);
    switch (type){
      case TAG.BYTE: return (typeof value === "boolean") ? this.#writeBoolean(value as boolean) : this.#writeByte((value as ByteTag).valueOf());
      case TAG.SHORT: return this.#writeShort((value as ShortTag).valueOf());
      case TAG.INT: return this.#writeInt((value as IntTag).valueOf());
      case TAG.LONG: return this.#writeLong(value as LongTag);
      case TAG.FLOAT: return this.#writeFloat((value as FloatTag).valueOf());
      case TAG.DOUBLE: return this.#writeDouble(value as DoubleTag);
      case TAG.BYTE_ARRAY: return this.#writeByteArray(value as ByteArrayTag,space,level);
      case TAG.STRING: return this.#writeString(value as StringTag);
      case TAG.LIST: return this.#writeList(value as ListTag,space,level);
      case TAG.COMPOUND: return this.#writeCompound(value as CompoundTag,space,level);
      case TAG.INT_ARRAY: return this.#writeIntArray(value as IntArrayTag,space,level);
      case TAG.LONG_ARRAY: return this.#writeLongArray(value as LongArrayTag,space,level);
      default: throw new Error("Invalid tag");
    }
  }

  #writeBoolean(value: boolean){
    return `${value}`;
  }

  #writeByte(value: number){
    return `${value}b`;
  }

  #writeShort(value: number){
    return `${value}s`;
  }

  #writeInt(value: number){
    return `${value}`;
  }

  #writeLong(value: bigint){
    return `${value}l`;
  }

  #writeFloat(value: number){
    return `${value}f`;
  }

  #writeDouble(value: number){
    return `${value}d`;
  }

  #writeByteArray(value: Int8Array, space: string, level: number){
    return `[B;${[...value as ByteArrayTag].map(entry => new Byte(entry)).map(entry => this.#writeTag(entry,space,level)).join() as string}]`;
  }

  #writeString(value: string){
    return escapeWithQuotes(value);
  }

  #writeList(value: ListTag, space: string, level: number){
    const fancy = (space !== "");
    value = (value as ListTag).filter((entry): entry is Tag => getTagType(entry) !== -1);
    const type = (value.length !== 0) ? getTagType(value[0]) as TAG : TAG.END;
    const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${this.#writeTag(entry,space,level + 1)}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
  }

  #writeCompound(value: CompoundTag, space: string, level: number){
    const fancy = (space !== "");
    return `{${[...Object.entries(value as CompoundTag)].map(([key,value]) => `${fancy ? `\n${(space as string).repeat(level)}` : ""}${UNQUOTED_STRING_PATTERN.test(key) ? key : escapeWithQuotes(key)}:${fancy ? " " : ""}${this.#writeTag(value,space,level + 1)}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
  }

  #writeIntArray(value: Int32Array, space: string, level: number){
    return `[I;${[...value as IntArrayTag].map(entry => new Int(entry)).map(entry => this.#writeTag(entry,space,level)).join() as string}]`;
  }

  #writeLongArray(value: BigInt64Array, space: string, level: number){
    return `[L;${[...value as LongArrayTag].map(entry => this.#writeTag(entry,space,level)).join() as string}]`;
  }
}

const SINGLE_QUOTE_ESCAPE_PATTERN = /['\\]/g;
const DOUBLE_QUOTE_ESCAPE_PATTERN = /["\\]/g;

function escapeWithQuotes(text: string) {
  const singleQuoteString = text.replace(SINGLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  const doubleQuoteString = text.replace(DOUBLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}