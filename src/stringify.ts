import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";

import type { Tag, RootTag, ByteTag, BooleanTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

const unquotedRegExp = /^[0-9A-Za-z.+_-]+$/;

export interface StringifyOptions {
  pretty?: boolean;
  breakLength?: number;
  quote?: "single" | "double";
}

export function stringify(data: RootTag, options: StringifyOptions = {}): string {
  const pretty = !!options.pretty;
  const breakLength = options.breakLength || 70;
  const quoteChar = options.quote == "single" ? "'" : options.quote == "double" ? '"' : null;
  const spaces = " ".repeat(4);

  function escapeString(text: string): string {
    let q = quoteChar ?? '"';

    if (quoteChar == null){
      for (let i = 0; i < text.length && i < 8; i++){
        switch (text[i]){
          case "'": q = '"'; break;
          case '"': q = "'"; break;
          default: continue;
        }
        break;
      }
    }

    return `${q}${text.replace(RegExp(`[${q}\\\\]`, "g"), x => `\\${x}`)}${q}`;
  }

  function stringify(tag: Tag, depth: number): string {
    const space = pretty ? " " : "", sep = pretty ? ", " : ",";

    switch (true){
      case tag instanceof Int8: return `${tag as ByteTag}b`;
      case tag instanceof Int16: return `${tag as ShortTag}s`;
      case tag instanceof Int32: return `${tag as IntTag}`;
      case typeof tag == "bigint": return `${tag as LongTag}l`;
      case tag instanceof Float32: return `${tag as FloatTag}f`;
      case typeof tag == "number": return Number.isInteger(tag) ? `${tag}.0` : tag.toString();
      case typeof tag == "string": return escapeString(tag as StringTag);
      case tag instanceof Int8Array: return `[B;${space}${[...tag as ByteArrayTag].join(sep)}]`;
      case tag instanceof Int32Array: return `[I;${space}${[...tag as IntArrayTag].join(sep)}]`;
      case tag instanceof BigInt64Array: return `[L;${space}${[...tag as LongArrayTag].join(sep)}]`;
      case tag instanceof Array: {
        const list = (tag as ListTag).map(tag => stringify(tag,depth + 1));
        if (list.reduce((acc,x) => acc + x.length,0) > breakLength || list.some(text => text.includes("\n"))){
          return `[\n${list.map(text => spaces.repeat(depth) + text).join(",\n")}\n${spaces.repeat(depth - 1)}]`;
        } else {
          return `[${list.join(sep)}]`;
        }
      }
      default: {
        const pairs = (Object.entries(tag as CompoundTag)
          .filter(([_,v]) => v != null))
          .map(([key,tag]) => {
            if (!unquotedRegExp.test(key)){
              key = escapeString(key);
            }
            return `${key}:${space}${stringify(tag!,depth + 1)}`;
          });
        if (pretty && pairs.reduce((acc,x) => acc + x.length,0) > breakLength){
          return `{\n${pairs.map(text => spaces.repeat(depth) + text).join(",\n")}\n${spaces.repeat(depth - 1)}}`;
        } else {
          return `{${space}${pairs.join(sep)}${space}}`;
        }
      }
    }
  }

  return stringify(data as Tag,1);
}