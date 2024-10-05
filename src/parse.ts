import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";

import type { Tag, RootTag, RootTagLike, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

const UNQUOTED_STRING_PATTERN = /^[0-9A-Za-z.+_-]+$/;

/**
 * Converts an SNBT string into an NBT object.
*/
export function parse<T extends RootTagLike = RootTag>(data: string): T {
  if (typeof data !== "string") {
    data satisfies never;
    throw new TypeError("First parameter must be a string");
  }

  return new SNBTReader().parseRoot(data) as T;
}

class SNBTReader {
  #i: number = 0;
  #index: number = 0;

  #peek(data: string, index: number, byteOffset: number = index): string {
    const value: string | undefined = data[byteOffset];
    if (value === undefined) {
      throw this.#unexpectedEnd();
    }
    return value;
  }

  #unexpectedEnd(): Error {
    return new Error("Unexpected end");
  }

  #unexpectedChar(data: string, index: number, i?: number): Error {
    if (i == null) {
      i = index;
    }
    return new Error(`Unexpected character ${this.#peek(data, index)} at position ${index}`);
  }

  #skipWhitespace(data: string): void {
    while (this.#index < data.length) {
      if (!/ |\t|\r/.test(this.#peek(data, this.#index)) && this.#peek(data, this.#index) != "\n") return;
      this.#index += 1;
    }
  }

  parseRoot(data: string): RootTag {
    this.#skipWhitespace(data);

    this.#i = this.#index;

    switch (this.#peek(data, this.#index)) {
      case "{": {
        this.#index++;
        return this.#parseCompound(data);
      }
      case "[": {
        this.#index++;
        const list: ByteArrayTag | ListTag<Tag> | IntArrayTag | LongArrayTag = this.#parseList(data, "[root]");
        const type: TAG = getTagType(list);
        if (type !== TAG.LIST) break;
        return list as ListTag<Tag>;
      }
    }

    throw new Error("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  #parseTag(data: string, key: string): Tag {
    this.#skipWhitespace(data);

    this.#i = this.#index;

    switch (this.#peek(data, this.#index)) {
      case "{": {
        this.#index++;
        return this.#parseCompound(data);
      }
      case "[": return (this.#index++, this.#parseList(data, key));
      case '"':
      case "'": return this.#parseQuotedString(data);
      default: {
        if (
          /^(true)$/.test(data.slice(this.#i, this.#index + 4)) ||
          /^(false)$/.test(data.slice(this.#i, this.#index + 5))
        ) {
          return (this.#parseUnquotedString(data) as "true" | "false" === "true") as BooleanTag;
        }
        const value: ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | null = this.#parseNumber(data);
        if (value != null && (this.#index == data.length || !UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index)))) {
          return value;
        }
        return (data.slice(this.#i, this.#index) + this.#parseUnquotedString(data)) as StringTag;
      }
    }
  }

  #parseNumber(data: string): ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | null {
    if (!"-0123456789".includes(this.#peek(data, this.#index))) return null;

    this.#i = this.#index++;
    let hasFloatingPoint: boolean = false;

    while (this.#index < data.length) {
      const char: string = this.#peek(data, this.#index);
      this.#index++;
      if ("0123456789e-+".includes(char)) continue;

      switch (char.toLowerCase()) {
        case ".": {
          if (hasFloatingPoint) {
            this.#index--;
            return null;
          }
          hasFloatingPoint = true;
          break;
        }
        case "f": return new Float32(Number(data.slice(this.#i, this.#index - 1))) satisfies FloatTag;
        case "d": return Number(data.slice(this.#i, this.#index - 1)) satisfies DoubleTag;
        case "b": return new Int8(Number(data.slice(this.#i, this.#index - 1))) satisfies ByteTag;
        case "s": return new Int16(Number(data.slice(this.#i, this.#index - 1))) satisfies ShortTag;
        case "l": return BigInt(data.slice(this.#i, this.#index - 1)) satisfies LongTag;
        default: {
          if (hasFloatingPoint) {
            return Number(data.slice(this.#i, --this.#index)) satisfies DoubleTag;
          } else {
            return new Int32(Number(data.slice(this.#i, --this.#index))) satisfies IntTag;
          }
        }
      }
    }

    if (hasFloatingPoint) {
      return Number(data.slice(this.#i, this.#index)) satisfies DoubleTag;
    } else {
      return new Int32(Number(data.slice(this.#i, this.#index))) satisfies IntTag;
    }
  }

  #parseString(data: string): StringTag {
    if (this.#peek(data, this.#index) == '"' || this.#peek(data, this.#index) == "'") {
      return this.#parseQuotedString(data);
    } else {
      return this.#parseUnquotedString(data);
    }
  }

  #parseUnquotedString(data: string): StringTag {
    this.#i = this.#index;

    while (this.#index < data.length) {
      if (!UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index))) break;
      this.#index++;
    }

    if (this.#index - this.#i == 0) {
      if (this.#index == data.length) {
        throw this.#unexpectedEnd();
      } else {
        throw this.#unexpectedChar(data, this.#index);
      }
    }

    return data.slice(this.#i, this.#index);
  }

  #parseQuotedString(data: string): StringTag {
    const quoteChar: string = this.#peek(data, this.#index);
    // i = 
    ++this.#index;
    let string: string = "";

    while (this.#index < data.length) {
      let char: string = this.#peek(data, this.#index++);

      if (char === "\\") {
        char = `\\${this.#peek(data, this.#index++)}`;
      }

      if (char === quoteChar) {
        return string;
      }

      string += this.#unescapeString(char);
    }

    throw this.#unexpectedEnd();
  }

  #unescapeString(value: StringTag): string {
    return value
      .replaceAll("\\\\", "\\")
      .replaceAll("\\\"", "\"")
      .replaceAll("\\'", "'")
      .replaceAll("\\0", "\0")
      .replaceAll("\\b", "\b")
      .replaceAll("\\f", "\f")
      .replaceAll("\\n", "\n")
      .replaceAll("\\r", "\r")
      .replaceAll("\\t", "\t");
  }

  #skipCommas(data: string, isFirst: boolean, end: string): void {
    this.#skipWhitespace(data);

    if (this.#peek(data, this.#index) == ",") {
      if (isFirst) {
        throw this.#unexpectedChar(data, this.#index);
      } else {
        this.#index++;
        this.#skipWhitespace(data);
      }
    } else if (!isFirst && this.#peek(data, this.#index) != end) {
      throw this.#unexpectedChar(data, this.#index);
    }
  }

  #parseArray(data: string, type: "B" | "I" | "L"): ByteArrayTag | IntArrayTag | LongArrayTag {
    const array: string[] = [];

    while (this.#index < data.length) {
      this.#skipCommas(data, array.length == 0, "]");

      if (this.#peek(data, this.#index) == "]") {
        this.#index++;
        switch (type) {
          case "B": return Int8Array.from(array.map(v => Number(v))) satisfies ByteArrayTag;
          case "I": return Int32Array.from(array.map(v => Number(v))) satisfies IntArrayTag;
          case "L": return BigInt64Array.from(array.map(v => BigInt(v))) satisfies LongArrayTag;
        }
      }

      this.#i = this.#index;
      if (this.#peek(data, this.#index) == "-") {
        this.#index++;
      }

      while (this.#index < data.length) {
        if (!"0123456789".includes(this.#peek(data, this.#index))) break;
        this.#index++;
      }

      const prefix: "b" | "l" | "" = (type === "B") ? "b" : (type === "L") ? "l" : "";

      if (this.#peek(data, this.#index) == prefix) {
        this.#index++;
      }

      if (this.#index - this.#i == 0) {
        throw this.#unexpectedChar(data, this.#index);
      }
      if (UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index))) {
        throw this.#unexpectedChar(data, this.#index);
      }

      array.push(data.slice(this.#i, this.#index - ((type !== "I") ? 1 : 0)));
    }

    throw this.#unexpectedEnd();
  }

  #parseList(data: string, key: string): ByteArrayTag | ListTag<Tag> | IntArrayTag | LongArrayTag {
    if ("BILbil".includes(this.#peek(data, this.#index)) && data[this.#index + 1] == ";") {
      return this.#parseArray(data, this.#peek(data, (this.#index += 2) - 2).toUpperCase() as "B" | "I" | "L") satisfies ByteArrayTag | IntArrayTag | LongArrayTag;
    }

    const array: ListTag<Tag> = [];
    let type: TAG | undefined;

    while (this.#index < data.length) {
      this.#skipWhitespace(data);

      if (this.#peek(data, this.#index) == ",") {
        if (array.length == 0) {
          throw this.#unexpectedChar(data, this.#index);
        } else {
          this.#index++;
          this.#skipWhitespace(data);
        }
      } else if (array.length > 0 && this.#peek(data, this.#index) != "]") {
        throw this.#unexpectedChar(data, this.#index - 1);
      }

      if (this.#peek(data, this.#index) == "]") {
        this.#index++;
        return array satisfies ListTag<Tag>;
      }

      const entry: Tag = this.#parseTag(data, key);

      if (type === undefined) {
        type = getTagType(entry);
      }
      if (getTagType(entry) !== type) {
        throw new TypeError(`Encountered unexpected item type '${getTagType(entry)}' in List '${key}' at index ${array.length}, expected item type '${type}'. All tags in a List tag must be of the same type`);
      }

      array.push(entry);
    }

    throw this.#unexpectedEnd();
  }

  #parseCompound(data: string): CompoundTag {
    const value: CompoundTag = {};
    let first: boolean = true;

    while (true) {
      this.#skipCommas(data, first, "}");
      first = false;

      if (this.#peek(data, this.#index) == "}") {
        this.#index++;
        return value;
      }

      const key: string = this.#parseString(data);
      this.#skipWhitespace(data);

      if (data[this.#index++] != ":") {
        throw this.#unexpectedChar(data, this.#index);
      }

      value[key] = this.#parseTag(data, key);
    }
  }
}