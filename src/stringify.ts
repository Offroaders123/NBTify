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
  const fancy = (space !== "");

  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return (typeof value === "boolean") ? `${value as BooleanTag}` : `${value as ByteTag}b`;
    case TAG.SHORT: return `${value as ShortTag}s`;
    case TAG.INT: return `${value as IntTag}`;
    case TAG.LONG: return `${value as LongTag}l`;
    case TAG.FLOAT: return `${value as FloatTag}f`;
    case TAG.DOUBLE: return `${value as DoubleTag}d`;
    case TAG.BYTE_ARRAY: return `[B;${[...value as ByteArrayTag].map(entry => new Byte(entry)).map(entry => writeTag(entry,space,level)).join() as string}]`;
    case TAG.STRING: return escapeWithQuotes(value as StringTag);
    case TAG.LIST: return (() => {
      value = (value as ListTag).filter((entry): entry is Tag => getTagType(entry) !== -1);
      const type = (value.length !== 0) ? getTagType(value[0]) as TAG : TAG.END;
      const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
      return `[${value.map(entry => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${writeTag(entry,space,level + 1)}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
    })();
    case TAG.COMPOUND: {
      return `{${[...Object.entries(value as CompoundTag)].map(([key,value]) => `${fancy ? `\n${(space as string).repeat(level)}` : ""}${UNQUOTED_STRING_PATTERN.test(key) ? key : escapeWithQuotes(key)}:${fancy ? " " : ""}${writeTag(value,space,level + 1)}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
    }
    case TAG.INT_ARRAY: return `[I;${[...value as IntArrayTag].map(entry => new Int(entry)).map(entry => writeTag(entry,space,level)).join() as string}]`;
    case TAG.LONG_ARRAY: return `[L;${[...value as LongArrayTag].map(entry => writeTag(entry,space,level)).join() as string}]`;
    default: throw new Error("Invalid tag");
  }
}

const SINGLE_QUOTE_ESCAPE_PATTERN = /['\\]/g;
const DOUBLE_QUOTE_ESCAPE_PATTERN = /["\\]/g;

function escapeWithQuotes(text: string) {
  const singleQuoteString = text.replace(SINGLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  const doubleQuoteString = text.replace(DOUBLE_QUOTE_ESCAPE_PATTERN,(char) => `\\${char}`);
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}