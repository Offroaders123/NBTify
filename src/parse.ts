import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";

import type { RootTag, Tag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

const UNQUOTED_STRING_PATTERN = /^[0-9A-Za-z.+_-]+$/;

/**
 * Converts an SNBT string into a CompoundTag object.
*/
export function parse<T extends RootTag = never>(data: string): T {
  if (typeof data !== "string"){
    throw new TypeError("First parameter must be a string");
  }

  return new SNBTReader().read<T>(data);
}

/**
 * The base implementation to convert an SNBT string into a CompoundTag object.
*/
export class SNBTReader {
  #data!: string;
  #index!: number;
  #i!: number;
  #char!: string;

  /**
   * Initiates the reader over an SNBT string.
  */
  read<T extends RootTag = never>(data: string): T {
    if (typeof data !== "string"){
      throw new TypeError("First parameter must be a string");
    }

    this.#data = data;
    this.#index = 0;
    this.#i = 0;
    this.#char = "";

    return this.#readRoot() as T;
  }

  #peek(byteOffset: number = this.#index): string {
    const value = this.#data[byteOffset];
    if (value === undefined){
      throw this.#unexpectedEnd();
    }
    return value;
  }

  #unexpectedEnd(): Error {
    return new Error("Unexpected end");
  }

  #unexpectedChar(i?: number): Error {
    if (i == null) i = this.#index;
    return new Error(`Unexpected character ${this.#peek()} at position ${this.#index}`);
  }

  #skipWhitespace(): void {
    while (this.#index < this.#data.length){
      if (this.#peek() != " " && this.#peek() != "\n") return;
      this.#index += 1;
    }
  }

  #readRoot(): RootTag {
    this.#skipWhitespace();

    this.#i = this.#index;
    this.#char = this.#peek();

    switch (this.#char){
      case "{": return (this.#index++,this.#readCompound());
      case "[": {
        this.#index++;
        const list = this.#readList();
        const type = getTagType(list);
        if (type !== TAG.LIST) break;
        return list as ListTag<Tag>;
      };
    }

    throw new Error("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  #readTag(): Tag {
    this.#skipWhitespace();

    this.#i = this.#index;
    this.#char = this.#peek();

    switch (this.#char){
      case "{": return (this.#index++,this.#readCompound());
      case "[": return (this.#index++,this.#readList());
      case '"':
      case "'": return this.#readQuotedString();
      default: {
        if (
          /^(true)$/.test(this.#data.slice(this.#i,this.#index + 4)) ||
          /^(false)$/.test(this.#data.slice(this.#i,this.#index + 5))
        ){
          return this.#readUnquotedString() as "true" | "false" === "true";
        }
        const value = this.#readNumber();
        if (value != null && (this.#index == this.#data.length || !UNQUOTED_STRING_PATTERN.test(this.#peek()))){
          return value;
        }
        return this.#data.slice(this.#i,this.#index) + this.#readUnquotedString();
      }
    }
  }

  #readNumber(): ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | null {
    if (!"-0123456789".includes(this.#peek())) return null;

    this.#i = this.#index++;
    let hasFloatingPoint = false;

    while (this.#index < this.#data.length){
      this.#char = this.#peek(this.#index++);
      if ("0123456789".includes(this.#char)) continue;

      switch (this.#char.toLowerCase()){
        case ".": {
          if (hasFloatingPoint) return (this.#index--,null);
          hasFloatingPoint = true; break;
        }
        case "f": return new Float32(+this.#data.slice(this.#i,this.#index - 1));
        case "d": return +this.#data.slice(this.#i,this.#index - 1);
        case "b": return new Int8(+this.#data.slice(this.#i,this.#index - 1));
        case "s": return new Int16(+this.#data.slice(this.#i,this.#index - 1));
        case "l": return BigInt(this.#data.slice(this.#i,this.#index - 1));
        default: {
          if (hasFloatingPoint){
            return +this.#data.slice(this.#i,--this.#index);
          } else {
            return new Int32(+this.#data.slice(this.#i,--this.#index));
          }
        }
      }
    }

    if (hasFloatingPoint){
      return +this.#data.slice(this.#i,this.#index);
    } else {
      return new Int32(+this.#data.slice(this.#i,this.#index));
    }
  }

  #readString(): string {
    if (this.#peek() == '"' || this.#peek() == "'"){
      return this.#readQuotedString();
    } else {
      return this.#readUnquotedString();
    }
  }

  #readUnquotedString(): string {
    this.#i = this.#index;

    while (this.#index < this.#data.length){
      if (!UNQUOTED_STRING_PATTERN.test(this.#peek())) break;
      this.#index++;
    }

    if (this.#index - this.#i == 0){
      throw (this.#index == this.#data.length) ? this.#unexpectedEnd() : this.#unexpectedChar();
    }

    return this.#data.slice(this.#i, this.#index);
  }

  #readQuotedString(): string {
    const quoteChar = this.#peek();
    this.#i = ++this.#index;
    let string = "";

    while (this.#index < this.#data.length){
      this.#char = this.#peek(this.#index++);

      if (this.#char == "\\"){
        string += this.#data.slice(this.#i,this.#index - 1) + this.#peek();
        this.#i = ++this.#index;
      } else if (this.#char == quoteChar){
        return string + this.#data.slice(this.#i,this.#index - 1);
      }
    }

    throw this.#unexpectedEnd();
  }

  #skipCommas(isFirst: boolean, end: string): void {
    this.#skipWhitespace();

    if (this.#peek() == ","){
      if (isFirst){
        throw this.#unexpectedChar();
      } else {
        this.#index++;
        this.#skipWhitespace();
      }
    } else if (!isFirst && this.#peek() != end){
      throw this.#unexpectedChar();
    }
  }

  #readArray(type: "B" | "I" | "L"): ByteArrayTag | IntArrayTag | LongArrayTag {
    const array: string[] = [];

    while (this.#index < this.#data.length){
      this.#skipCommas(array.length == 0, "]");

      if (this.#peek() == "]"){
        this.#index++;
        switch (type){
          case "B": return Int8Array.from(array.map(v => +v));
          case "I": return Int32Array.from(array.map(v => +v));
          case "L": return BigInt64Array.from(array.map(v => BigInt(v)));
        }
      }

      this.#i = this.#index;
      if (this.#peek() == "-"){
        this.#index++;
      }

      while (this.#index < this.#data.length){
        if (!"0123456789".includes(this.#peek())) break;
        this.#index++;
      }

      const prefix = (type === "B") ? "b" : (type === "L") ? "l" : "";

      if (this.#peek() == prefix){
        this.#index++;
      }

      if (this.#index - this.#i == 0){
        throw this.#unexpectedChar();
      }
      if (UNQUOTED_STRING_PATTERN.test(this.#peek())){
        throw this.#unexpectedChar();
      }

      array.push(this.#data.slice(this.#i,this.#index - ((type !== "I") ? 1 : 0)));
    }

    throw this.#unexpectedEnd();
  }

  #readList(): ByteArrayTag | ListTag<Tag> | IntArrayTag | LongArrayTag {
    if ("BILbil".includes(this.#peek()) && this.#data[this.#index + 1] == ";"){
      return this.#readArray(this.#peek((this.#index += 2) - 2).toUpperCase() as "B" | "I" | "L");
    }

    const array: ListTag<Tag> = [];

    while (this.#index < this.#data.length){
      this.#skipWhitespace();

      if (this.#peek() == ","){
        if (array.length == 0){
          throw this.#unexpectedChar();
        } else {
          this.#index++;
          this.#skipWhitespace();
        }
      } else if (array.length > 0 && this.#peek() != "]"){
        throw this.#unexpectedChar(this.#index - 1);
      }

      if (this.#peek() == "]"){
        return (this.#index++,array);
      }

      array.push(this.#readTag());
    }

    throw this.#unexpectedEnd();
  }

  #readCompound(): CompoundTag {
    const entries: [string, Tag][] = [];
    let first = true;

    while (true){
      this.#skipCommas(first,"}");
      first = false;

      if (this.#peek() == "}"){
        this.#index++;
        return entries.reduce<CompoundTag>((obj,[k,v]) => (obj[k] = v,obj),{});
      }

      const key = this.#readString();
      this.#skipWhitespace();

      if (this.#data[this.#index++] != ":"){
        throw this.#unexpectedChar();
      }

      entries.push([key,this.#readTag()]);
    }
  }
}