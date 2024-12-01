import { NBTData } from "./format.js";
import { TAG, isTag, getTagType } from "./tag.js";

import type { Replacer } from "./write.js";
import type { Tag, RootTag, RootTagLike, ContainerTag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

export interface StringifyOptions {
  space: string | number;
  rootCheck: boolean;
}

/**
 * Converts an NBT object into an SNBT string.
*/
export function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options?: Partial<StringifyOptions>, replacer?: Replacer): string;
export function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, { space = "", rootCheck = true }: Partial<StringifyOptions> = {}, replacer?: Replacer): string {
  if (data instanceof NBTData) {
    data = data.data;
  }

  if (rootCheck && typeof data !== "object" || data === null) {
    data satisfies never;
    throw new TypeError("First parameter must be an object or array");
  }
  if (typeof space !== "string" && typeof space !== "number") {
    space satisfies never;
    throw new TypeError("Space option must be a string or number");
  }

  space = typeof space === "number" ? " ".repeat(space) : space;
  const level = 1;
  return stringifyRoot(data as RootTag, space, level, rootCheck, replacer);
}

function stringifyRoot(value: RootTag, space: string, level: number, rootCheck: boolean, replacer?: Replacer<ContainerTag>): string {
  if (replacer !== undefined) {
    value = replacer.call({ "": value }, "", value) as RootTag;
  }
  const type: TAG = getTagType(value);
  if (rootCheck && type !== TAG.LIST && type !== TAG.COMPOUND) {
    throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  return stringifyTag(value, space, level, replacer);
}

function stringifyTag(value: Tag, space: string, level: number, replacer?: Replacer<ContainerTag>): string {
  const type: TAG = getTagType(value);
  switch (type) {
    case TAG.BYTE: return stringifyByte(value as ByteTag | BooleanTag);
    case TAG.SHORT: return stringifyShort(value as ShortTag);
    case TAG.INT: return stringifyInt(value as IntTag);
    case TAG.LONG: return stringifyLong(value as LongTag);
    case TAG.FLOAT: return stringifyFloat(value as FloatTag);
    case TAG.DOUBLE: return stringifyDouble(value as DoubleTag);
    case TAG.BYTE_ARRAY: return stringifyByteArray(value as ByteArrayTag, replacer);
    case TAG.STRING: return stringifyString(value as StringTag);
    case TAG.LIST: return stringifyList(value as ListTag<Tag>, space, level, replacer);
    case TAG.COMPOUND: return stringifyCompound(value as CompoundTag, space, level, replacer);
    case TAG.INT_ARRAY: return stringifyIntArray(value as IntArrayTag, replacer);
    case TAG.LONG_ARRAY: return stringifyLongArray(value as LongArrayTag, replacer);
    default: throw new Error(`Encountered unsupported tag type '${type}'`);
  }
}

function stringifyByte(value: number | ByteTag | BooleanTag): string {
  return (typeof value === "boolean") ? `${value}` : `${value.valueOf()}b`;
}

function stringifyShort(value: number | ShortTag): string {
  return `${value.valueOf()}s`;
}

function stringifyInt(value: number | IntTag): string {
  return `${value.valueOf()}`;
}

function stringifyLong(value: LongTag): string {
  return `${value}l`;
}

function stringifyFloat(value: number | FloatTag): string {
  return `${value.valueOf()}${Number.isInteger(value.valueOf()) ? ".0" : ""}f`;
}

function stringifyDouble(value: DoubleTag): string {
  return `${value}${!Number.isInteger(value) || value.toExponential() === value.toString() ? "" : ".0"}d`;
}

function stringifyByteArray(value: ByteArrayTag, replacer?: Replacer<ContainerTag>): string {
  return `[B;${[...value].map((entry, i) => {
    if (replacer !== undefined) {
      entry = replacer.call(value, String(i), entry) as number;
    }
    return stringifyByte(entry);
  }).join() satisfies string}]`;
}

function stringifyString(value: StringTag): string {
  const singleQuoteString: string = escapeString(value.replace(/['\\]/g, character => `\\${character}`));
  const doubleQuoteString: string = escapeString(value.replace(/["\\]/g, character => `\\${character}`));
  return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}

function escapeString(value: StringTag): string {
  return value
    .replaceAll("\0", "\\0")
    .replaceAll("\b", "\\b")
    .replaceAll("\f", "\\f")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");
}

function stringifyList(value: ListTag<Tag>, space: string, level: number, replacer?: Replacer<ContainerTag>): string {
  value = value.filter(isTag);
  const fancy: boolean = (space !== "");
  const type: TAG = (value[0] !== undefined) ? getTagType(value[0]) : TAG.END;
  const isIndentedList: boolean = fancy && new Set<TAG>([TAG.BYTE_ARRAY, TAG.LIST, TAG.COMPOUND, TAG.INT_ARRAY, TAG.LONG_ARRAY]).has(type);
  return `[${value.map((entry, i) => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${(() => {
    if (replacer !== undefined) {
      entry = replacer.call(value, String(i), entry);
    }
    if (getTagType(entry) !== type) {
      throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
    }
    const result: string = stringifyTag(entry, space, level + 1, replacer);
    return result;
  })() satisfies string}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
}

function stringifyCompound(value: CompoundTag, space: string, level: number, replacer?: Replacer<ContainerTag>): string {
  const fancy: boolean = (space !== "");
  return `{${Object.entries(value).map(([name, entry]) => replacer !== undefined ? [name, replacer.call(value, name, entry)] : [name, entry]).filter((entry): entry is [string, Tag] => isTag(entry[1])).map(([key, value]) => `${fancy ? `\n${(space satisfies string).repeat(level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : stringifyString(key)}:${fancy ? " " : ""}${(() => {
    const result: string = stringifyTag(value, space, level + 1, replacer);
    return result;
  })() satisfies string}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
}

function stringifyIntArray(value: IntArrayTag, replacer?: Replacer<ContainerTag>): string {
  return `[I;${[...value].map((entry, i) => {
    if (replacer !== undefined) {
      entry = replacer.call(value, String(i), entry) as number;
    }
    return stringifyInt(entry);
  }).join() satisfies string}]`;
}

function stringifyLongArray(value: LongArrayTag, replacer?: Replacer<ContainerTag>): string {
  return `[L;${[...value].map((entry, i) => {
    if (replacer !== undefined) {
      entry = replacer.call(value, String(i), entry) as bigint;
    }
    return stringifyLong(entry);
  }).join() satisfies string}]`;
}