import { Int8, Int16, Int32, Float32 } from "./index.js";
import { TAG, getTagType } from "./index.js";

import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./index.js";

const UNQUOTED_STRING_PATTERN = /^[0-9A-Za-z.+_-]+$/;

/**
 * Converts an SNBT string into an NBT object.
*/
export function parse<T extends RootTagLike = RootTag>(data: string): T {
  if (typeof data !== "string"){
    data satisfies never;
    throw new TypeError("First parameter must be a string");
  }

    return parseRoot(data, 0, { index: 0 }) as T;
}

interface IndexRef {
  index: number;
}

  function peek(data: string, index: number, byteOffset: number = index): string {
    const value = data[byteOffset];
    if (value === undefined){
      throw unexpectedEnd();
    }
    return value;
  }

  function unexpectedEnd(): Error {
    return new Error("Unexpected end");
  }

  function unexpectedChar(data: string, index: number, i?: number): Error {
    if (i == null){
      i = index;
    }
    return new Error(`Unexpected character ${peek(data, index)} at position ${index}`);
  }

  function skipWhitespace(data: string, index: IndexRef): void {
    while (index.index < data.length){
      if (!/ |\t|\r/.test(peek(data, index.index)) && peek(data, index.index) != "\n") return;
      index.index += 1;
    }
  }

  function parseRoot(data: string, i: number, index: IndexRef): RootTag {
    skipWhitespace(data, index);

    i = index.index;

    switch (peek(data, index.index)){
      case "{": {
        index.index++;
        return parseCompound(data, i, index);
      }
      case "[": {
        index.index++;
        const list = parseList(data, "[root]", i, index);
        const type = getTagType(list);
        if (type !== TAG.LIST) break;
        return list as ListTag<Tag>;
      }
    }

    throw new Error("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  function parseTag(data: string, key: string, i: number, index: IndexRef): Tag {
    skipWhitespace(data, index);

    i = index.index;

    switch (peek(data, index.index)){
      case "{": {
        index.index++;
        return parseCompound(data, i, index);
      }
      case "[": return (index.index++,parseList(data, key, i, index));
      case '"':
      case "'": return parseQuotedString(data, index);
      default: {
        if (
          /^(true)$/.test(data.slice(i,index.index + 4)) ||
          /^(false)$/.test(data.slice(i,index.index + 5))
        ){
          return (parseUnquotedString(data, i, index) as "true" | "false" === "true") as BooleanTag;
        }
        const value = parseNumber(data, i, index);
        if (value != null && (index.index == data.length || !UNQUOTED_STRING_PATTERN.test(peek(data, index.index)))){
          return value;
        }
        return (data.slice(i,index.index) + parseUnquotedString(data, i, index)) as StringTag;
      }
    }
  }

  function parseNumber(data: string, i: number, index: IndexRef): ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | null {
    if (!"-0123456789".includes(peek(data, index.index))) return null;

    i = index.index++;
    let hasFloatingPoint = false;

    while (index.index < data.length){
      const char = peek(data, index.index);
      index.index++;
      if ("0123456789e-+".includes(char)) continue;

      switch (char.toLowerCase()){
        case ".": {
          if (hasFloatingPoint){
            index.index--;
            return null;
          }
          hasFloatingPoint = true;
          break;
        }
        case "f": return new Float32(+data.slice(i,index.index - 1)) satisfies FloatTag;
        case "d": return +data.slice(i,index.index - 1) satisfies DoubleTag;
        case "b": return new Int8(+data.slice(i,index.index - 1)) satisfies ByteTag;
        case "s": return new Int16(+data.slice(i,index.index - 1)) satisfies ShortTag;
        case "l": return BigInt(data.slice(i,index.index - 1)) satisfies LongTag;
        default: {
          if (hasFloatingPoint){
            return +data.slice(i,--index.index) satisfies DoubleTag;
          } else {
            return new Int32(+data.slice(i,--index.index)) satisfies IntTag;
          }
        }
      }
    }

    if (hasFloatingPoint){
      return +data.slice(i,index.index) satisfies DoubleTag;
    } else {
      return new Int32(+data.slice(i,index.index)) satisfies IntTag;
    }
  }

  function parseString(data: string, i: number, index: IndexRef): StringTag {
    if (peek(data, index.index) == '"' || peek(data, index.index) == "'"){
      return parseQuotedString(data, index);
    } else {
      return parseUnquotedString(data, i, index);
    }
  }

  function parseUnquotedString(data: string, i: number, index: IndexRef): StringTag {
    i = index.index;

    while (index.index < data.length){
      if (!UNQUOTED_STRING_PATTERN.test(peek(data, index.index))) break;
      index.index++;
    }

    if (index.index - i == 0){
      if (index.index == data.length){
        throw unexpectedEnd();
      } else {
        throw unexpectedChar(data, index.index);
      }
    }

    return data.slice(i, index.index);
  }

  function parseQuotedString(data: string, index: IndexRef): StringTag {
    const quoteChar = peek(data, index.index);
    // i = 
    ++index.index;
    let string = "";

    while (index.index < data.length){
      let char = peek(data, index.index++);

      if (char === "\\"){
        char = `\\${peek(data, index.index++)}`;
      }

      if (char === quoteChar){
        return string;
      }

      string += unescapeString(char);
    }

    throw unexpectedEnd();
  }

  function unescapeString(value: StringTag): string {
    return value
      .replaceAll("\\\\","\\")
      .replaceAll("\\\"","\"")
      .replaceAll("\\'","'")
      .replaceAll("\\b","\b")
      .replaceAll("\\f","\f")
      .replaceAll("\\n","\n")
      .replaceAll("\\r","\r")
      .replaceAll("\\t","\t");
  }

  function skipCommas(data: string, isFirst: boolean, end: string, index: IndexRef): void {
    skipWhitespace(data, index);

    if (peek(data, index.index) == ","){
      if (isFirst){
        throw unexpectedChar(data, index.index);
      } else {
        index.index++;
        skipWhitespace(data, index);
      }
    } else if (!isFirst && peek(data, index.index) != end){
      throw unexpectedChar(data, index.index);
    }
  }

  function parseArray(data: string, type: "B" | "I" | "L", i: number, index: IndexRef): ByteArrayTag | IntArrayTag | LongArrayTag {
    const array: string[] = [];

    while (index.index < data.length){
      skipCommas(data, array.length == 0, "]", index);

      if (peek(data, index.index) == "]"){
        index.index++;
        switch (type){
          case "B": return Int8Array.from(array.map(v => +v)) satisfies ByteArrayTag;
          case "I": return Int32Array.from(array.map(v => +v)) satisfies IntArrayTag;
          case "L": return BigInt64Array.from(array.map(v => BigInt(v))) satisfies LongArrayTag;
        }
      }

      i = index.index;
      if (peek(data, index.index) == "-"){
        index.index++;
      }

      while (index.index < data.length){
        if (!"0123456789".includes(peek(data, index.index))) break;
        index.index++;
      }

      const prefix = (type === "B") ? "b" : (type === "L") ? "l" : "";

      if (peek(data, index.index) == prefix){
        index.index++;
      }

      if (index.index - i == 0){
        throw unexpectedChar(data, index.index);
      }
      if (UNQUOTED_STRING_PATTERN.test(peek(data, index.index))){
        throw unexpectedChar(data, index.index);
      }

      array.push(data.slice(i,index.index - ((type !== "I") ? 1 : 0)));
    }

    throw unexpectedEnd();
  }

  function parseList(data: string, key: string, i: number, index: IndexRef): ByteArrayTag | ListTag<Tag> | IntArrayTag | LongArrayTag {
    if ("BILbil".includes(peek(data, index.index)) && data[index.index + 1] == ";"){
      return parseArray(data, peek(data, (index.index += 2) - 2).toUpperCase() as "B" | "I" | "L", i, index) satisfies ByteArrayTag | IntArrayTag | LongArrayTag;
    }

    const array: ListTag<Tag> = [];
    let type: TAG | undefined;

    while (index.index < data.length){
      skipWhitespace(data, index);

      if (peek(data, index.index) == ","){
        if (array.length == 0){
          throw unexpectedChar(data, index.index);
        } else {
          index.index++;
          skipWhitespace(data, index);
        }
      } else if (array.length > 0 && peek(data, index.index) != "]"){
        throw unexpectedChar(data, index.index - 1);
      }

      if (peek(data, index.index) == "]"){
        index.index++;
        return array satisfies ListTag<Tag>;
      }

      const entry = parseTag(data, key, i, index);

      if (type === undefined){
        type = getTagType(entry);
      }
      if (getTagType(entry) !== type){
        throw new TypeError(`Encountered unexpected item type '${getTagType(entry)}' in List '${key}' at index ${array.length}, expected item type '${type}'. All tags in a List tag must be of the same type`);
      }

      array.push(entry);
    }

    throw unexpectedEnd();
  }

  function parseCompound(data: string, i: number, index: IndexRef): CompoundTag {
    const entries: [string, Tag | undefined][] = [];
    let first = true;

    while (true){
      skipCommas(data, first,"}", index);
      first = false;

      if (peek(data, index.index) == "}"){
        index.index++;
        return entries.reduce<CompoundTag>((obj,[k,v]) => (obj[k] = v,obj),{});
      }

      const key = parseString(data, i, index);
      skipWhitespace(data, index);

      if (data[index.index++] != ":"){
        throw unexpectedChar(data, index.index);
      }

      entries.push([key,parseTag(data, key, i, index)]);
    }
  }