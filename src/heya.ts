import { getTagType, TAG } from "./index.js";

import type { Tag, ListTag, CompoundTag, ByteArrayTag } from "./index.js";

const WHITESPACE_PATTERN = / |\n|\t|\r/;
const OPEN_CURLY_BRACKET = "{";
const CLOSE_CURLY_BRACKET = "}";
const OPEN_BRACKET = "[";
const CLOSE_BRACKET = "]";
const COMMA_SEPARATOR = ",";
const COLON_SEPARATOR = ":";
const BYTE_ARRAY_PREFIX = "B";
const INT_ARRAY_PREFIX = "I";
const LONG_ARRAY_PREFIX = "L";

export class SNBTReader {
  #i: number = 0;
  #index: number = 0;

  #readTag(data: string): Tag {}

  #readByteArray(data: string): ByteArrayTag {
    const values: number[] = [];
    this.#readWhitespace(data);
    this.#readOpenBracket(data);
    while (this.#index < data.length) {
      this.#readWhitespace(data);
      const character: string = data[this.#index]!.toUpperCase();
      switch (character) {
        case BYTE_ARRAY_PREFIX: this.#index += 1; continue;
      }
    }
  }

  #readList(data: string): ListTag<Tag> {
    let type: TAG;
    const value: ListTag<Tag> = [];
    this.#readWhitespace(data);
    this.#readOpenBracket(data);
    while (this.#index < data.length) {
      this.#readWhitespace(data);
      const character: string = data[this.#index]!;
      switch (character) {
        case COMMA_SEPARATOR: this.#readCommaSeparator(); continue;
        case CLOSE_BRACKET: this.#readCloseBracket(); return value;
      }
      const entry: Tag = this.#readTag(data);
      type ??= getTagType(entry);
      if (getTagType(entry) !== type) {
        throw new Error(`Expected tag type '${type}', encountered '${getTagType(entry)}'`);
      }
      value.push(entry);
    }
    throw new SyntaxError("Encountered unexpected end of List tag");
  }

  #readCompound(data: string): CompoundTag {
    const value: CompoundTag = {};
    let empty: boolean = true;
    this.#readWhitespace(data);
    this.#readOpenCurlyBracket(data);
    while (this.#index < data.length) {
      this.#readWhitespace(data);
      const character: string = data[this.#index]!;
      switch (character) {
        case COMMA_SEPARATOR: {
          if (empty) {
            throw new SyntaxError(`Unexpected token '${character}'`);
          }
          this.#readCommaSeparator();
          continue;
        }
        case CLOSE_CURLY_BRACKET: this.#readCloseCurlyBracket(); return value;
      }
      if (!empty) {
        throw new SyntaxError(`Unexpected token '${character}'`);
      }
      const key: string = this.#readString(data);
      this.#readWhitespace(data);
      this.#readColonSeparator(data);
      const entry: Tag = this.#readTag(data);
      value[key] = entry;
    }
  }

  #readWhitespace(data: string): void {
    while (this.#index < data.length) {
      const character: string = data[this.#index]!;
      if (!WHITESPACE_PATTERN.test(character)) break;
      this.#index += 1;
    }
  }

  #readOpenCurlyBracket(data: string): void {
    const character: string = data[this.#index]!;
    if (character !== OPEN_CURLY_BRACKET) {
      throw new SyntaxError(`Unexpected token '${character}'`);
    }
    this.#index += 1;
  }

  #readCloseCurlyBracket(): void {
    this.#index += 1;
  }

  #readOpenBracket(data: string): void {
    const character: string = data[this.#index]!;
    if (character !== OPEN_BRACKET) {
      throw new SyntaxError(`Unexpected token '${character}'`);
    }
    this.#index += 1;
  }

  #readCloseBracket(): void {
    this.#index += 1;
  }

  #readCommaSeparator(): void {
    this.#index += 1;
  }

  #readColonSeparator(data: string): void {
    const character: string = data[this.#index]!;
    if (character !== COLON_SEPARATOR) {
      throw new SyntaxError(`Unexpected token '${character}'`);
    }
    this.#index += 1;
  }
}