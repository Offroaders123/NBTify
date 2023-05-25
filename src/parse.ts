import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";

import type { Tag, RootTag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

/**
 * Converts an SNBT string into a CompoundTag object.
*/
export function parse<T extends RootTag = any>(data: string): T {
  if (typeof data !== "string"){
    throw new TypeError("First parameter must be a string");
  }

  const reader = new SNBTReader();
  return reader.read<T>(data);
}

/**
 * The base implementation to convert an SNBT string into a CompoundTag object.
*/
export class SNBTReader {
  #data!: string;
  #offset!: number;

  /**
   * Initiates the reader over an SNBT string.
  */
  read<T extends RootTag = any>(data: string): T {
    if (typeof data !== "string"){
      throw new TypeError("First parameter must be a string");
    }

    this.#data = data;
    this.#offset = 0;

    const tag = this.#readCompoundTag() as T;
    const lastChar = this.#peek(-1);

    const endPos = this.#offset;
    this.#skipWhitespace();

    if (this.#canRead()){
      const type = getTagType(tag);
      if (this.#offset > endPos || type === TAG.LIST || type === TAG.COMPOUND || lastChar == "'" || lastChar == '"'){
        throw new Error("Unexpected non-whitespace character after tag");
      }
      throw new Error(`Unexpected character '${this.#peek()}' at end of tag`);
    }
    return tag;
  }

  #canRead(length = 1): boolean {
    return this.#offset + length <= this.#data.length;
  }

  #peek(offset = 0): string {
    return this.#data[this.#offset + offset];
  }

  #next(): string {
    return this.#data[this.#offset++];
  }

  #skip(length = 1): void {
    this.#offset += length;
  }

  #skipSeperator(): boolean {
    this.#skipWhitespace();

    if (this.#canRead() && this.#peek() == ","){
      this.#skip();
      this.#skipWhitespace();
      return true;
    } else {
      return false;
    }
  }

  #skipWhitespace(): void {
    // WHITESPACE_PATTERN
    while (this.#canRead() && /\s+/.test(this.#peek())){
      this.#skip();
    }
  }

  #expect(character: string): void {
    if (!this.#canRead() || this.#peek() != character){
      throw new Error(`Expected '${character}'`);
    }
    this.#offset += 1;
  }

  #readTag(): Tag {
    this.#skipWhitespace();

    if (!this.#canRead()){
      throw new Error("Expected tag");
    }

    const char = this.#data[this.#offset];
    if (char == "{") return this.#readCompoundTag();
    if (char == "[") return this.#readSomeList();
    if (char == '"' || char == "'"){
      return this.#readQuotedString(char) as StringTag;
    }

    const string = this.#readUnquotedString();
    if (string == null){
      throw new Error(`Unexpected character '${char}' while reading tag`);
    }

    try {
      // INTEGER_PATTERN
      let match = string.match(/^([-+]?(?:0|[1-9][0-9]*))([bls]?)$/i);
      if (match) return this.#readInteger(match);

      // FLOAT_PATTERN
      match = string.match(/^([-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?)([df]?)$/i);
      if (match) return this.#readFloat(match);

      // TRUE_PATTERN or FALSE_PATTERN
      if (/^true$/i.test(string) || /^false$/i.test(string)) return Boolean(string);
    } catch {
      return string as StringTag;
    }
    return string as StringTag;
  }

  #readInteger([_,value,suffix]: RegExpMatchArray): ByteTag | ShortTag | IntTag | LongTag {
    switch (suffix){
      case "b":
      case "B": return new Int8(Number(value)) as ByteTag;
      case "s":
      case "S": return new Int16(Number(value)) as ShortTag;
      case "l":
      case "L": return BigInt(value) as LongTag;
      default: return new Int32(Number(value)) as IntTag;
    }
  }

  #readFloat([_,value,suffix]: RegExpMatchArray): FloatTag | DoubleTag {
    switch (suffix){
      case "f":
      case "F": return new Float32(Number(value)) as FloatTag;
      default: return Number(value) as DoubleTag;
    }
  }

  #readByteArray(tags: Tag[]): ByteArrayTag {
    const array = new Int8Array(tags.length);
    for (let i = 0; i < tags.length; i++){
      array[i] = tags[i].valueOf() as number;
    }
    return array as ByteArrayTag;
  }

  #readString(): StringTag | null {
    const char = this.#peek();
    return (char == '"' || char == "'") ? this.#readQuotedString(char) : this.#readUnquotedString();
  }

  #readUnquotedString(): StringTag | null {
    // UNQUOTED_STRING_OPEN_PATTERN
    const match = this.#data.slice(this.#offset).match(/^[0-9a-z_\-.+]+/i);
    if (match === null) return null;

    this.#offset += match[0].length;
    return match[0];
  }

  #readQuotedString(quoteChar: string): StringTag {
    let lastPos = ++this.#offset;
    let string = "";

    while (this.#canRead()){
      const char = this.#next();

      if (char == "\\"){
        if (!this.#canRead()){
          throw new Error("Unexpected end while reading escape sequence");
        }

        const escapeChar = this.#peek();

        if (escapeChar != quoteChar && escapeChar != "\\"){
          throw new Error(`Invalid escape character '${escapeChar}'`);
        }

        string += this.#data.slice(lastPos, this.#offset - 1) + escapeChar;
        lastPos = ++this.#offset;
      } else if (char == quoteChar){
        return string + this.#data.slice(lastPos, this.#offset - 1);
      }
    }
    throw new Error(`Missing end quote`);
  }

  #readSomeList(): ByteArrayTag | ListTag | IntArrayTag | LongArrayTag {
    this.#expect("[");

    let tagType: typeof TAG.BYTE_ARRAY | typeof TAG.LIST | typeof TAG.INT_ARRAY | typeof TAG.LONG_ARRAY = TAG.LIST;

    if (this.#canRead(2) && this.#peek(1) == ";"){
      const char = this.#peek();

      switch (char){
        case "B": tagType = TAG.BYTE_ARRAY; break;
        case "I": tagType = TAG.INT_ARRAY; break;
        case "L": tagType = TAG.LONG_ARRAY; break;
        default: throw new Error(`Invalid array type '${char}'`);
      }

      this.#skip(2);
    }

    this.#skipWhitespace();

    const tags: Tag[] = [];

    while (this.#canRead() && this.#peek() != "]"){
      const tag = this.#readTag();

      // if (tagType == null){
      //   tagType = tag.constructor;
      // } else if (!(tag instanceof tagType)){
      //   throw new Error(
      //     `Expected tag of type ${tagType.name} but got ${tag.constructor}`,
      //   );
      // }

      tags.push(tag);

      if (!this.#skipSeperator()){
        if (this.#peek() != "]"){
          throw new Error(`Unexpected character '${this.#peek()}' at end of tag`);
        }
        break;
      }
    }

    if (!this.#canRead()){
      throw Error("Expected tag or ']'");
    }

    this.#expect("]");

    switch (tagType){
      case TAG.BYTE_ARRAY: return this.#readByteArray(tags);
      case TAG.INT_ARRAY: return this.#readIntArray(tags);
      case TAG.LONG_ARRAY: return this.#readLongArray(tags);
      case TAG.LIST: return tags as ListTag;
    }
  }

  #readCompoundTag(): CompoundTag {
    this.#skipWhitespace();
    this.#expect("{");

    const tag: CompoundTag = {};

    while (this.#canRead() && this.#peek() != "}"){
      this.#skipWhitespace();

      if (this.#peek() === "}") break;

      const key = this.#readString();

      if (key == null){
        throw new Error(`Unexpected character '${this.#peek()}' while expecting key-value pair or '}'`);
      }
      if (key == ""){
        throw new Error("Key cannot be empty");
      }

      this.#skipWhitespace();
      this.#expect(":");

      tag[key] = this.#readTag();

      if (!this.#skipSeperator()){
        if (this.#peek() != "}"){
          throw new Error(`Unexpected character '${this.#peek()}' at end of tag`);
        }
        break;
      }
    }

    if (!this.#canRead()){
      throw new Error("Expected key-value pair or '}'");
    }

    this.#skip();

    return tag;
  }

  #readIntArray(tags: Tag[]): IntArrayTag {
    const array = new Int32Array(tags.length);
    for (let i = 0; i < tags.length; i++){
      array[i] = tags[i].valueOf() as number;
    }
    return array;
  }

  #readLongArray(tags: Tag[]): LongArrayTag {
    const array = new BigInt64Array(tags.length);
    for (let i = 0; i < tags.length; i++){
      array[i] = BigInt(tags[i].valueOf() as number);
    }
    return array;
  }
}