import { NBTData } from "./data.js";
import { Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getTagType } from "./tag.js";
import { Byte, Short, Int, Float } from "./primitive.js";

const UNQUOTED_STRING_PATTERN = /^[0-9a-z_\-.+]+$/i;

export function stringify(data: CompoundTag | NBTData, space: string | number = ""){
  if (data instanceof NBTData){
    data = data.data as CompoundTag;
  }
  space = (typeof space === "number") ? " ".repeat(space) : space;
  return writeTag(data,space);
}

function writeTag(value: Tag, space: string, level = 1): string {
  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return (typeof value === "boolean") ? writeBoolean(value as boolean) : writeByte((value as ByteTag).valueOf());
    case TAG.SHORT: return writeShort((value as ShortTag).valueOf());
    case TAG.INT: return writeInt((value as IntTag).valueOf());
    case TAG.LONG: return writeLong(value as LongTag);
    case TAG.FLOAT: return writeFloat((value as FloatTag).valueOf());
    case TAG.DOUBLE: return writeDouble(value as DoubleTag);
    case TAG.BYTE_ARRAY: return writeByteArray(value as ByteArrayTag,space,level);
    case TAG.STRING: return writeString(value as StringTag);
    case TAG.LIST: return writeList(value as ListTag,space,level);
    case TAG.COMPOUND: return writeCompound(value as CompoundTag,space,level);
    case TAG.INT_ARRAY: return writeIntArray(value as IntArrayTag,space,level);
    case TAG.LONG_ARRAY: return writeLongArray(value as LongArrayTag,space,level);
    default: throw new Error("Invalid tag");
  }
}

function writeBoolean(value: boolean){
  return `${value}`;
}

function writeByte(value: number){
  return `${value}b`;
}

function writeShort(value: number){
  return `${value}s`;
}

function writeInt(value: number){
  return `${value}`;
}

function writeLong(value: bigint){
  return `${value}l`;
}

function writeFloat(value: number){
  return `${value}f`;
}

function writeDouble(value: number){
  return `${value}d`;
}

function writeByteArray(value: Int8Array, space: string, level: number){
  return `[B;${[...value as ByteArrayTag].map(entry => new Byte(entry)).map(entry => writeTag(entry,space,level)).join() as string}]`;
}

function writeString(value: string){
  return escapeWithQuotes(value);
}

function writeList(value: ListTag, space: string, level: number){
  const fancy = (space !== "");
  value = (value as ListTag).filter((entry): entry is Tag => getTagType(entry) !== -1);
  const type = (value.length !== 0) ? getTagType(value[0]) as TAG : TAG.END;
  const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
  return `[${value.map(entry => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${writeTag(entry,space,level + 1)}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
}

function writeCompound(value: CompoundTag, space: string, level: number){
  const fancy = (space !== "");
  return `{${[...Object.entries(value as CompoundTag)].map(([key,value]) => `${fancy ? `\n${(space as string).repeat(level)}` : ""}${UNQUOTED_STRING_PATTERN.test(key) ? key : escapeWithQuotes(key)}:${fancy ? " " : ""}${writeTag(value,space,level + 1)}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
}

function writeIntArray(value: Int32Array, space: string, level: number){
  return `[I;${[...value as IntArrayTag].map(entry => new Int(entry)).map(entry => writeTag(entry,space,level)).join() as string}]`;
}

function writeLongArray(value: BigInt64Array, space: string, level: number){
  return `[L;${[...value as LongArrayTag].map(entry => writeTag(entry,space,level)).join() as string}]`;
}

const SINGLE_QUOTE_ESCAPE_PATTERN = /['\\]/g;
const DOUBLE_QUOTE_ESCAPE_PATTERN = /["\\]/g;

function escapeWithQuotes(text: string) {
  const singleQuoteString = text.replace(SINGLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  const doubleQuoteString = text.replace(DOUBLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}