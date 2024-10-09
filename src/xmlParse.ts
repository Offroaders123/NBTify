import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { DOMParser } from "xmldom";

import type { Tag, RootTag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tag.js";

enum ALLOWED_TAGS {
  ByteTag = "ByteTag",
  ShortTag = "ShortTag",
  IntTag = "IntTag",
  LongTag = "LongTag",
  FloatTag = "FloatTag",
  DoubleTag = "DoubleTag",
  ByteArrayTag = "ByteArrayTag",
  StringTag = "StringTag",
  ListTag = "ListTag",
  CompoundTag = "CompoundTag",
  IntArrayTag = "IntArrayTag",
  LongArrayTag = "LongArrayTag"
}

function parseTag(tag: Element): RootTag {
  const tagName = tag.tagName;
  const nameAttr = tag.getAttribute("name");

  switch (tagName as ALLOWED_TAGS) {
    case "ByteTag":
      return { [nameAttr!]: new Int8(Number(tag.textContent)) };
    case "ShortTag":
      return { [nameAttr!]: new Int16(Number(tag.textContent)) };
    case "IntTag":
      return { [nameAttr!]: new Int32(Number(tag.textContent)) };
    case "LongTag":
      return { [nameAttr!]: BigInt(tag.textContent!) };
    case "FloatTag":
      return { [nameAttr!]: new Float32(Number(tag.textContent)) };
    case "DoubleTag":
      return { [nameAttr!]: Number(tag.textContent) };
    case "ByteArrayTag":
      return { [nameAttr!]: parseByteArrayTag(tag) };
    case "IntArrayTag":
      return { [nameAttr!]: parseIntArrayTag(tag) };
    case "LongArrayTag":
      return { [nameAttr!]: parseLongArrayTag(tag) };
    case "StringTag":
      return { [nameAttr!]: tag.textContent! };
    case "CompoundTag":
      return { [nameAttr!]: parseCompoundTag(tag) };
    case "ListTag":
      return { [nameAttr!]: parseListTag(tag) };
    default:
      throw new TypeError(`All tags must only be NBT primitives, received tag '${tagName}'`);
  }
}

function parseCompoundTag(tag: Element): CompoundTag {
  const compound: CompoundTag = {};
  // console.log(tag.childNodes);
  for (const key in tag.childNodes) {
    const child = tag.childNodes[key]!;
    if (child.nodeType === 1) { // Element node
      const parsedTag = parseTag(child as Element);
      Object.assign(compound, parsedTag);
    }
  }
  return compound;
}

function parseListTag(tag: Element): ListTag<Tag> {
  const list: ListTag<Tag> = [];
  for (const key in tag.childNodes) {
    const child = tag.childNodes[key]!;
    if (child.nodeType === 1) { // Element node
      const parsedTag = parseTag(child as Element);
      // Since this is a list, we push the tag value directly into the list.
      list.push(Object.values(parsedTag)[0]!); // Use the value, not the object
    }
  }
  return list;
}

function parseByteArrayTag(tag: Element): ByteArrayTag {
  const byteArray: number[] = [];
  for (const key in tag.childNodes) {
    const child = tag.childNodes[key]!;
    if (child.nodeType === 1 && child.tagName === "ByteTag") {
      byteArray.push(Number((child as Element).textContent));
    }
  }
  return new Uint8Array(byteArray);
}

function parseIntArrayTag(tag: Element): IntArrayTag {
  const intArray: number[] = [];
  for (const key in tag.childNodes) {
    const child = tag.childNodes[key]!;
    if (child.nodeType === 1 && child.tagName === "IntTag") {
      intArray.push(Number((child as Element).textContent));
    }
  }
  return new Int32Array(intArray);
}

function parseLongArrayTag(tag: Element): LongArrayTag {
  const longArray: bigint[] = [];
  for (const key in tag.childNodes) {
    const child = tag.childNodes[key]!;
    if (child.nodeType === 1 && child.tagName === "LongTag") {
      longArray.push(BigInt((child as Element).textContent!));
    }
  }
  return new BigInt64Array(longArray);
}

// Main parsing function
export function parseXML(xml: string): RootTag {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const rootTag = doc.documentElement;

  if (rootTag.tagName === "CompoundTag") {
    return parseCompoundTag(rootTag);
  } else if (rootTag.tagName === "ListTag") {
    return parseListTag(rootTag);
  } else {
    throw new Error("Invalid root tag. Expected CompoundTag or ListTag.");
  }
}