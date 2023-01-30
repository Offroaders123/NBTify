import { NBTData } from "./data.js";
import { Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG, getTagType } from "./tag.js";
import { Byte, Short, Int, Float } from "./primitive.js";

const UNQUOTED_STRING_PATTERN = /^[0-9a-z_\-.+]+$/i;

export function stringify(value: Tag, space: string | number = "", level = 1): string {
  space = (typeof space === "number") ? "".padStart(space," ") : space;
  const fancy = (space !== "");

  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return (typeof value === "boolean") ? `${value}` : `${value as ByteTag}b`;
    case TAG.SHORT: return `${value as ShortTag}s`;
    case TAG.INT: return `${value as IntTag}`;
    case TAG.LONG: return `${value as LongTag}l`;
    case TAG.FLOAT: return `${value as FloatTag}f`;
    case TAG.DOUBLE: return `${value as DoubleTag}d`;
    case TAG.BYTE_ARRAY: return `[B;${stringifyList([...value as ByteArrayTag].map(entry => new Byte(entry)),space,level)}]`;
    case TAG.STRING: return escapeWithQuotes(value as StringTag);
    case TAG.LIST: return `[${stringifyList(value as ListTag,space,level)}]`;
    case TAG.COMPOUND: {
      return `{${[...Object.entries(value as CompoundTag)].map(([key,value]) => `${fancy ? `\n${"".padStart((space as string).length * level,space as string)}` : ""}${stringifyKey(key)}:${fancy ? " " : ""}${stringify(value,space,level + 1)}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${"".padStart(space.length * (level - 1),space)}` : ""}}`;
    }
    case TAG.INT_ARRAY: return `[I;${stringifyList([...value as IntArrayTag].map(entry => new Int(entry)),space,level)}]`;
    case TAG.LONG_ARRAY: return `[L;${stringifyList([...value as LongArrayTag] as LongTag[],space,level)}]`;
    default: throw new Error("Invalid tag");
  }
}

function stringifyList(list: Tag[], space: string, level: number) {
  const [template] = list;
  const type = getTagType(template) as TAG;
  const fancy = (space !== "" && list.length !== 0 && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type));
  return `${list.map((tag) => `${fancy ? `\n${"".padStart(space.length * level,space)}` : ""}${stringify(tag,space,level + 1)}`).join(",")}${fancy ? `\n${"".padStart(space.length * (level - 1),space)}` : ""}`;
}

function stringifyKey(key: string) {
  return UNQUOTED_STRING_PATTERN.test(key) ? key : escapeWithQuotes(key);
}

const SINGLE_QUOTE_ESCAPE_PATTERN = /['\\]/g;
const DOUBLE_QUOTE_ESCAPE_PATTERN = /["\\]/g;

function escapeWithQuotes(text: string) {
  const singleQuoteString = text.replace(SINGLE_QUOTE_ESCAPE_PATTERN, escapeChar);
  const doubleQuoteString = text.replace(DOUBLE_QUOTE_ESCAPE_PATTERN, escapeChar);
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}

function escapeChar(char: string) {
  return `\\${char}`;
}