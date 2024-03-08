import { NBTData } from "./index.js";
import { TAG, isTag, getTagType } from "./index.js";
import { Int8, Int32 } from "./index.js";

import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./index.js";

export interface StringifyOptions {
  space?: string | number;
}

/**
 * Converts an NBT object into an SNBT string.
*/
export function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options?: StringifyOptions): string;
export function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, { space = "" }: StringifyOptions = {}): string {
  if (data instanceof NBTData){
    data = data.data;
  }

  if (typeof data !== "object" || data === null){
    data satisfies never;
    throw new TypeError("First parameter must be an object or array");
  }
  if (typeof space !== "string" && typeof space !== "number"){
    space satisfies never;
    throw new TypeError("Space option must be a string or number");
  }

  space = typeof space === "number" ? " ".repeat(space) : space;
  const level = 1;
  return stringifyRoot(data as RootTag, space, level);
}

function stringifyRoot(value: RootTag, space: string, level: number): string {
  const type = getTagType(value);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  return stringifyTag(value, space, level);
}

function stringifyTag(value: Tag, space: string, level: number): string {
  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return stringifyByte(value as ByteTag | BooleanTag);
    case TAG.SHORT: return stringifyShort(value as ShortTag);
    case TAG.INT: return stringifyInt(value as IntTag);
    case TAG.LONG: return stringifyLong(value as LongTag);
    case TAG.FLOAT: return stringifyFloat(value as FloatTag);
    case TAG.DOUBLE: return stringifyDouble(value as DoubleTag);
    case TAG.BYTE_ARRAY: return stringifyByteArray(value as ByteArrayTag);
    case TAG.STRING: return stringifyString(value as StringTag);
    case TAG.LIST: return stringifyList(value as ListTag<Tag>, space, level);
    case TAG.COMPOUND: return stringifyCompound(value as CompoundTag, space, level);
    case TAG.INT_ARRAY: return stringifyIntArray(value as IntArrayTag);
    case TAG.LONG_ARRAY: return stringifyLongArray(value as LongArrayTag);
    default: throw new Error(`Encountered unsupported tag type '${type}'`);
  }
}

function stringifyByte(value: ByteTag | BooleanTag): string {
  return (typeof value === "boolean") ? `${value}` : `${value.valueOf()}b`;
}

function stringifyShort(value: ShortTag): string {
  return `${value.valueOf()}s`;
}

function stringifyInt(value: IntTag): string {
  return `${value.valueOf()}`;
}

function stringifyLong(value: LongTag): string {
  return `${value}l`;
}

function stringifyFloat(value: FloatTag): string {
  return `${value.valueOf()}${Number.isInteger(value.valueOf()) ? ".0" : ""}f`;
}

function stringifyDouble(value: DoubleTag): string {
  return `${value}${!Number.isInteger(value) || value.toExponential() === value.toString() ? "" : ".0"}d`;
}

function stringifyByteArray(value: ByteArrayTag): string {
  return `[B;${[...value].map(entry => stringifyByte(new Int8(entry))).join() satisfies string}]`;
}

function stringifyString(value: StringTag): string {
  const singleQuoteString = escapeString(value.replace(/['\\]/g,character => `\\${character}`));
  const doubleQuoteString = escapeString(value.replace(/["\\]/g,character => `\\${character}`));
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}

function escapeString(value: StringTag): string {
  return value
    .replaceAll("\b","\\b")
    .replaceAll("\f","\\f")
    .replaceAll("\n","\\n")
    .replaceAll("\r","\\r")
    .replaceAll("\t","\\t");
}

function stringifyList(value: ListTag<Tag>, space: string, level: number): string {
  value = value.filter(isTag);
  const fancy = (space !== "");
  const type: TAG = (value[0] !== undefined) ? getTagType(value[0]) : TAG.END;
  const isIndentedList = fancy && new Set<TAG>([TAG.BYTE_ARRAY,TAG.LIST,TAG.COMPOUND,TAG.INT_ARRAY,TAG.LONG_ARRAY]).has(type);
  return `[${value.map(entry => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${(() => {
    if (getTagType(entry) !== type){
      throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
    }
    const result = stringifyTag(entry, space, level + 1);
    return result;
  })() satisfies string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
}

function stringifyCompound(value: CompoundTag, space: string, level: number): string {
  const fancy = (space !== "");
  return `{${Object.entries(value).filter((entry): entry is [string,Tag] => isTag(entry[1])).map(([key,value]) => `${fancy ? `\n${(space satisfies string).repeat(level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : stringifyString(key)}:${fancy ? " " : ""}${(() => {
    const result = stringifyTag(value, space, level + 1);
    return result;
  })() satisfies string}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
}

function stringifyIntArray(value: IntArrayTag): string {
  return `[I;${[...value].map(entry => stringifyInt(new Int32(entry))).join() satisfies string}]`;
}

function stringifyLongArray(value: LongArrayTag): string {
  return `[L;${[...value].map(entry => stringifyLong(entry)).join() satisfies string}]`;
}