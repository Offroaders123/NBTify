import { readFile, writeFile } from "node:fs/promises";

const demo = async () => {

const fileDemo = await readFile(process.argv[2]!);
console.log(fileDemo);

const readDemo = await read(fileDemo);
console.log(readDemo);

const writeDemo = Buffer.from((await write(readDemo)).buffer);
console.log(writeDemo);
console.log(Buffer.compare(fileDemo, writeDemo));

await writeFile(`${process.argv[2]!}2.nbt`,writeDemo);

};

if (process.argv.length > 2) demo();

// parse SNBT

const UNQUOTED_STRING_PATTERN = /^[0-9A-Za-z.+_-]+$/;

export function parse<T extends RootTagLike = RootTag>(data: string): T {
  return new SNBTReader().read<T>(data);
}

interface IndexRef {
  index: number;
}

export class SNBTReader {
  // #data!: string;
  // #index!: number;
  // #i!: number;
  // #char!: string;

  read<T extends RootTagLike = RootTag>(data: string): T {
    if (typeof data !== "string"){
      data satisfies never;
      throw new TypeError("First parameter must be a string");
    }

    // this.#data = data;
    // this.#index = 0;
    // this.#i = 0;
    // this.#char = "";

    return this.#readRoot(data, 0, { index: 0 }) as T;
  }

  #peek(data: string, index: number, byteOffset: number = index): string {
    const value = data[byteOffset];
    if (value === undefined){
      throw this.#unexpectedEnd();
    }
    return value;
  }

  #unexpectedEnd(): Error {
    return new Error("Unexpected end");
  }

  #unexpectedChar(data: string, index: number, i?: number): Error {
    if (i == null){
      i = index;
    }
    return new Error(`Unexpected character ${this.#peek(data, index)} at position ${index}`);
  }

  #skipWhitespace(data: string, index: IndexRef): void {
    while (index.index < data.length){
      if (!/ |\t|\r/.test(this.#peek(data, index.index)) && this.#peek(data, index.index) != "\n") return;
      index.index += 1;
    }
  }

  #readRoot(data: string, i: number, index: IndexRef): RootTag {
    this.#skipWhitespace(data, index);

    i = index.index;

    switch (this.#peek(data, index.index)){
      case "{": {
        index.index++;
        return this.#readCompound(data, i, index);
      }
      case "[": {
        index.index++;
        const list = this.#readList(data, "[root]", i, index);
        const type = getTagType(list);
        if (type !== TAG.LIST) break;
        return list as ListTag<Tag>;
      }
    }

    throw new Error("Encountered unexpected Root tag type, must be either a List or Compound tag");
  }

  #readTag(data: string, key: string, i: number, index: IndexRef): Tag {
    this.#skipWhitespace(data, index);

    i = index.index;

    switch (this.#peek(data, index.index)){
      case "{": {
        index.index++;
        return this.#readCompound(data, i, index);
      }
      case "[": return (index.index++,this.#readList(data, key, i, index));
      case '"':
      case "'": return this.#readQuotedString(data, index);
      default: {
        if (
          /^(true)$/.test(data.slice(i,index.index + 4)) ||
          /^(false)$/.test(data.slice(i,index.index + 5))
        ){
          return (this.#readUnquotedString(data, i, index) as "true" | "false" === "true") as BooleanTag;
        }
        const value = this.#readNumber(data, i, index);
        if (value != null && (index.index == data.length || !UNQUOTED_STRING_PATTERN.test(this.#peek(data, index.index)))){
          return value;
        }
        return (data.slice(i,index.index) + this.#readUnquotedString(data, i, index)) as StringTag;
      }
    }
  }

  #readNumber(data: string, i: number, index: IndexRef): ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | null {
    if (!"-0123456789".includes(this.#peek(data, index.index))) return null;

    i = index.index++;
    let hasFloatingPoint = false;

    while (index.index < data.length){
      const char = this.#peek(data, index.index);
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

  #readString(data: string, i: number, index: IndexRef): StringTag {
    if (this.#peek(data, index.index) == '"' || this.#peek(data, index.index) == "'"){
      return this.#readQuotedString(data, index);
    } else {
      return this.#readUnquotedString(data, i, index);
    }
  }

  #readUnquotedString(data: string, i: number, index: IndexRef): StringTag {
    i = index.index;

    while (index.index < data.length){
      if (!UNQUOTED_STRING_PATTERN.test(this.#peek(data, index.index))) break;
      index.index++;
    }

    if (index.index - i == 0){
      if (index.index == data.length){
        throw this.#unexpectedEnd();
      } else {
        throw this.#unexpectedChar(data, index.index);
      }
    }

    return data.slice(i, index.index);
  }

  #readQuotedString(data: string, index: IndexRef): StringTag {
    const quoteChar = this.#peek(data, index.index);
    // i = 
    ++index.index;
    let string = "";

    while (index.index < data.length){
      let char = this.#peek(data, index.index++);

      if (char === "\\"){
        char = `\\${this.#peek(data, index.index++)}`;
      }

      if (char === quoteChar){
        return string;
      }

      string += this.#unescapeString(char);
    }

    throw this.#unexpectedEnd();
  }

  #unescapeString(value: StringTag): string {
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

  #skipCommas(data: string, isFirst: boolean, end: string, index: IndexRef): void {
    this.#skipWhitespace(data, index);

    if (this.#peek(data, index.index) == ","){
      if (isFirst){
        throw this.#unexpectedChar(data, index.index);
      } else {
        index.index++;
        this.#skipWhitespace(data, index);
      }
    } else if (!isFirst && this.#peek(data, index.index) != end){
      throw this.#unexpectedChar(data, index.index);
    }
  }

  #readArray(data: string, type: "B" | "I" | "L", i: number, index: IndexRef): ByteArrayTag | IntArrayTag | LongArrayTag {
    const array: string[] = [];

    while (index.index < data.length){
      this.#skipCommas(data, array.length == 0, "]", index);

      if (this.#peek(data, index.index) == "]"){
        index.index++;
        switch (type){
          case "B": return Int8Array.from(array.map(v => +v)) satisfies ByteArrayTag;
          case "I": return Int32Array.from(array.map(v => +v)) satisfies IntArrayTag;
          case "L": return BigInt64Array.from(array.map(v => BigInt(v))) satisfies LongArrayTag;
        }
      }

      i = index.index;
      if (this.#peek(data, index.index) == "-"){
        index.index++;
      }

      while (index.index < data.length){
        if (!"0123456789".includes(this.#peek(data, index.index))) break;
        index.index++;
      }

      const prefix = (type === "B") ? "b" : (type === "L") ? "l" : "";

      if (this.#peek(data, index.index) == prefix){
        index.index++;
      }

      if (index.index - i == 0){
        throw this.#unexpectedChar(data, index.index);
      }
      if (UNQUOTED_STRING_PATTERN.test(this.#peek(data, index.index))){
        throw this.#unexpectedChar(data, index.index);
      }

      array.push(data.slice(i,index.index - ((type !== "I") ? 1 : 0)));
    }

    throw this.#unexpectedEnd();
  }

  #readList(data: string, key: string, i: number, index: IndexRef): ByteArrayTag | ListTag<Tag> | IntArrayTag | LongArrayTag {
    if ("BILbil".includes(this.#peek(data, index.index)) && data[index.index + 1] == ";"){
      return this.#readArray(data, this.#peek(data, (index.index += 2) - 2).toUpperCase() as "B" | "I" | "L", i, index) satisfies ByteArrayTag | IntArrayTag | LongArrayTag;
    }

    const array: ListTag<Tag> = [];
    let type: TAG | undefined;

    while (index.index < data.length){
      this.#skipWhitespace(data, index);

      if (this.#peek(data, index.index) == ","){
        if (array.length == 0){
          throw this.#unexpectedChar(data, index.index);
        } else {
          index.index++;
          this.#skipWhitespace(data, index);
        }
      } else if (array.length > 0 && this.#peek(data, index.index) != "]"){
        throw this.#unexpectedChar(data, index.index - 1);
      }

      if (this.#peek(data, index.index) == "]"){
        index.index++;
        return array satisfies ListTag<Tag>;
      }

      const entry = this.#readTag(data, key, i, index);

      if (type === undefined){
        type = getTagType(entry);
      }
      if (getTagType(entry) !== type){
        throw new TypeError(`Encountered unexpected item type '${getTagType(entry)}' in List '${key}' at index ${array.length}, expected item type '${type}'. All tags in a List tag must be of the same type`);
      }

      array.push(entry);
    }

    throw this.#unexpectedEnd();
  }

  #readCompound(data: string, i: number, index: IndexRef): CompoundTag {
    const entries: [string, Tag | undefined][] = [];
    let first = true;

    while (true){
      this.#skipCommas(data, first,"}", index);
      first = false;

      if (this.#peek(data, index.index) == "}"){
        index.index++;
        return entries.reduce<CompoundTag>((obj,[k,v]) => (obj[k] = v,obj),{});
      }

      const key = this.#readString(data, i, index);
      this.#skipWhitespace(data, index);

      if (data[index.index++] != ":"){
        throw this.#unexpectedChar(data, index.index);
      }

      entries.push([key,this.#readTag(data, key, i, index)]);
    }
  }
}

// stringify SNBT

export interface StringifyOptions {
  space?: string | number;
}

export function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, { space = "" }: StringifyOptions = {}): string {
  if (data instanceof NBTData){
    data = data.data;
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

// format

export type RootName = string | null;
export type Endian = "big" | "little";
export type Compression = CompressionFormat | null;
export type BedrockLevel = boolean;

export interface Format {
  rootName: RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
}

export interface NBTDataOptions extends Partial<Format> {}

export class NBTData<T extends RootTagLike = RootTag> implements Format {
  data: T;
  rootName: RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;

  constructor(data: T | NBTData<T>, options: NBTDataOptions = {}) {
    if (data instanceof NBTData){
      if (options.rootName === undefined){
        options.rootName = data.rootName;
      }
      if (options.endian === undefined){
        options.endian = data.endian;
      }
      if (options.compression === undefined){
        options.compression = data.compression;
      }
      if (options.bedrockLevel === undefined){
        options.bedrockLevel = data.bedrockLevel;
      }
      data = data.data;
    }

    const { rootName = "", endian = "big", compression = null, bedrockLevel = false } = options;

    this.data = data;
    this.rootName = rootName;
    this.endian = endian;
    this.compression = compression;
    this.bedrockLevel = bedrockLevel;
  }

  get [Symbol.toStringTag]() {
    return "NBTData" as const;
  }
}

// error

export interface NBTErrorOptions extends ErrorOptions {
  byteOffset: number;
  cause: NBTData;
  remaining: number;
}

export class NBTError extends Error {
  byteOffset: number;
  override cause: NBTData;
  remaining: number;

  constructor(message: string, options: NBTErrorOptions) {
    super(message,options);
    this.byteOffset = options.byteOffset;
    this.cause = options.cause;
    this.remaining = options.remaining;
  }
}

// read

export interface ReadOptions {
  rootName: boolean | RootName;
  endian: Endian;
  compression: Compression;
  bedrockLevel: BedrockLevel;
  strict: boolean;
}

export async function read<T extends RootTagLike = RootTag>(data: Uint8Array, options: Partial<ReadOptions> = {}): Promise<NBTData<T>> {
  const reader = new DataReader(data);
  let { rootName, endian, compression, bedrockLevel, strict = true } = options;

  compression: if (compression === undefined){
    switch (true){
      case hasGzipHeader(reader): compression = "gzip"; break compression;
      case hasZlibHeader(reader): compression = "deflate"; break compression;
    }
    try {
      return await read<T>(data,{ ...options, compression: null });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, compression: "deflate-raw" });
      } catch {
        throw error;
      }
    }
  }

  compression satisfies Compression;

  if (endian === undefined){
    try {
      return await read<T>(data,{ ...options, endian: "big" });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, endian: "little" });
      } catch {
        throw error;
      }
    }
  }

  endian satisfies Endian;

  if (rootName === undefined){
    try {
      return await read<T>(data,{ ...options, rootName: true });
    } catch (error){
      try {
        return await read<T>(data,{ ...options, rootName: false });
      } catch {
        throw error;
      }
    }
  }

  rootName satisfies boolean | RootName;

  if (compression !== null){
    data = await decompress(data,compression);
  }

  if (bedrockLevel === undefined){
    bedrockLevel = hasBedrockLevelHeader(reader,endian);
  }

  return readRoot<T>(reader, { rootName, endian, compression, bedrockLevel, strict });
}

function hasGzipHeader(reader: DataReader): boolean {
  const header = reader.view.getUint16(0,false);
  return header === 0x1F8B;
}

function hasZlibHeader(reader: DataReader): boolean {
  const header = reader.view.getUint8(0);
  return header === 0x78;
}

function hasBedrockLevelHeader(reader: DataReader, endian: Endian): boolean {
  const byteLength = reader.view.getUint32(4,true);
  return byteLength === reader.data.byteLength - 8 && endian === "little";
}

async function readRoot<T extends RootTagLike = RootTag>(reader: DataReader, { rootName, endian, compression, bedrockLevel, strict }: ReadOptions): Promise<NBTData<T>> {
  let littleEndian: boolean = endian === "little";

  if (compression !== null){
    reader.data = await decompress(reader.data,compression);
    reader.view = new DataView(reader.data.buffer);
  }

  if (bedrockLevel){
    // const version =
      reader.readUint32(littleEndian);
    reader.readUint32(littleEndian);
  }

  const type = readTagType(reader);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new Error(`Expected an opening List or Compound tag at the start of the buffer, encountered tag type '${type}'`);
  }

  const rootNameV: RootName = typeof rootName === "string" || rootName ? readString(reader, littleEndian) : null;
  const root: T = readTag<T>(reader, type, littleEndian);

  if (strict && reader.data.byteLength > reader.byteOffset){
    const remaining = reader.data.byteLength - reader.byteOffset;
    throw new NBTError(`Encountered unexpected End tag at byte offset ${reader.byteOffset}, ${remaining} unread bytes remaining`,{ byteOffset: reader.byteOffset, cause: new NBTData<RootTag>(root as RootTag,{ rootName: rootNameV, endian }), remaining });
  }

  return new NBTData(root, { rootName: rootNameV, endian, compression, bedrockLevel });
}

function readTag<T extends Tag>(reader: DataReader, type: TAG, littleEndian: boolean): T;
function readTag<T extends RootTagLike>(reader: DataReader, type: TAG, littleEndian: boolean): T;
function readTag(reader: DataReader, type: TAG, littleEndian: boolean): Tag {
  switch (type){
    case TAG.END: {
      const remaining = reader.data.byteLength - reader.byteOffset;
      throw new Error(`Encountered unexpected End tag at byte offset ${reader.byteOffset}, ${remaining} unread bytes remaining`);
    }
    case TAG.BYTE: return readByte(reader);
    case TAG.SHORT: return readShort(reader, littleEndian);
    case TAG.INT: return readInt(reader, littleEndian);
    case TAG.LONG: return readLong(reader, littleEndian);
    case TAG.FLOAT: return readFloat(reader, littleEndian);
    case TAG.DOUBLE: return readDouble(reader, littleEndian);
    case TAG.BYTE_ARRAY: return readByteArray(reader, littleEndian);
    case TAG.STRING: return readString(reader, littleEndian);
    case TAG.LIST: return readList(reader, littleEndian);
    case TAG.COMPOUND: return readCompound(reader, littleEndian);
    case TAG.INT_ARRAY: return readIntArray(reader, littleEndian);
    case TAG.LONG_ARRAY: return readLongArray(reader, littleEndian);
    default: throw new Error(`Encountered unsupported tag type '${type}' at byte offset ${reader.byteOffset}`);
  }
}

function readTagType(reader: DataReader): TAG {
  return reader.readUint8() as TAG;
}

function readByte(reader: DataReader): ByteTag {
  return new Int8(reader.readInt8());
}

function readShort(reader: DataReader, littleEndian: boolean): ShortTag {
  return new Int16(reader.readInt16(littleEndian));
}

function readInt(reader: DataReader, littleEndian: boolean): IntTag {
  return new Int32(reader.readInt32(littleEndian));
}

function readLong(reader: DataReader, littleEndian: boolean): LongTag {
  return reader.readBigInt64(littleEndian);
}

function readFloat(reader: DataReader, littleEndian: boolean): FloatTag {
  return new Float32(reader.readFloat32(littleEndian));
}

function readDouble(reader: DataReader, littleEndian: boolean): DoubleTag {
  return reader.readFloat64(littleEndian);
}

function readByteArray(reader: DataReader, littleEndian: boolean): ByteArrayTag {
  return reader.readInt8Array(reader.readInt32(littleEndian));
}

function readString(reader: DataReader, littleEndian: boolean): StringTag {
  const length = reader.readUint16(littleEndian);
  return reader.readString(length);
}

function readList(reader: DataReader, littleEndian: boolean): ListTag<Tag> {
  const type = readTagType(reader);
  const length = reader.readInt32(littleEndian);
  const value: ListTag<Tag> = [];
  Object.defineProperty(value,TAG_TYPE,{
    configurable: true,
    enumerable: false,
    writable: true,
    value: type
  });
  for (let i = 0; i < length; i++){
    const entry = readTag(reader, type, littleEndian);
    value.push(entry);
  }
  return value;
}

function readCompound(reader: DataReader, littleEndian: boolean): CompoundTag {
  const value: CompoundTag = {};
  while (true){
    const type = readTagType(reader);
    if (type === TAG.END) break;
    const nameLength = reader.readUint16(littleEndian);
    const name = reader.readString(nameLength);
    const entry = readTag(reader, type, littleEndian);
    value[name] = entry;
  }
  return value;
}

function readIntArray(reader: DataReader, littleEndian: boolean): IntArrayTag {
  return reader.readInt32Array(reader.readInt32(littleEndian), littleEndian);
}

function readLongArray(reader: DataReader, littleEndian: boolean): LongArrayTag {
  return reader.readBigInt64Array(reader.readInt32(littleEndian), littleEndian);
}

class DataReader {
  byteOffset: number;
  data: Uint8Array;
  view: DataView;
  private decoder: TextDecoder;

  constructor(data: Uint8Array) {
    this.byteOffset = 0;
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.decoder = new TextDecoder();
  }

  readUint8(): number {
    return this.read("Uint8");
  }

  readInt8(): number {
    return this.read("Int8");
  }

  readUint16(littleEndian: boolean): number {
    return this.read("Uint16", littleEndian);
  }

  readInt16(littleEndian: boolean): number {
    return this.read("Int16", littleEndian);
  }

  readUint32(littleEndian: boolean): number {
    return this.read("Uint32", littleEndian);
  }

  readInt32(littleEndian: boolean): number {
    return this.read("Int32", littleEndian);
  }

  readFloat32(littleEndian: boolean): number {
    return this.read("Float32", littleEndian);
  }

  readFloat64(littleEndian: boolean): number {
    return this.read("Float64", littleEndian);
  }

  readBigUint64(littleEndian: boolean): bigint {
    return this.read("BigUint64", littleEndian);
  }

  readBigInt64(littleEndian: boolean): bigint {
    return this.read("BigInt64", littleEndian);
  }

  private read<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T): ReturnType<DataView[`get${T}`]>;
  private read<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, littleEndian: boolean): ReturnType<DataView[`get${T}`]>;
  private read(type: keyof typeof ByteType, littleEndian?: boolean): number | bigint {
    this.allocate(ByteType[type]);
    return this.view[`get${type}`]((this.byteOffset += ByteType[type]) - ByteType[type], littleEndian);
  }

  readInt8Array(length: number): Int8Array {
    this.allocate(length);
    return new Int8Array(this.data.subarray(this.byteOffset, this.byteOffset += length));
  }

  readString(length: number): string {
    this.allocate(length);
    return this.decoder.decode(this.data.subarray(this.byteOffset, this.byteOffset += length));
  }

  readInt32Array(length: number, littleEndian: boolean): Int32Array {
    const value = new Int32Array(length);
    for (const i in value){
      const entry = this.readInt32(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  readBigInt64Array(length: number, littleEndian: boolean): BigInt64Array {
    const value = new BigInt64Array(length);
    for (const i in value){
      const entry = this.readBigInt64(littleEndian);
      value[i] = entry;
    }
    return value;
  }

  private allocate(byteLength: number): void {
    if (this.byteOffset + byteLength > this.data.byteLength){
      throw new Error("Ran out of bytes to read, unexpectedly reached the end of the buffer");
    }
  }
}

// write

export async function write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options?: NBTDataOptions): Promise<Uint8Array> {
  const writer = new DataWriter();
  if (!(data instanceof NBTData)){
    data = new NBTData(data, options);
  }
  // edit: yep! This does fix it, interestingly enough
  // if (!(data instanceof NBTData)){
  //   throw 5;
  // }
                // @ts-expect-error - not sure why this isn't being caught just yet, I think it might be my `typeof`/`instanceof` checks for parameter validation.
  return writeRoot(data, writer);
}

async function writeRoot<T extends RootTagLike = RootTag>(data: NBTData<T>, writer: DataWriter): Promise<Uint8Array> {
  const { data: root, rootName, endian, compression, bedrockLevel } = data;
  const littleEndian: boolean = endian === "little";
  const type = getTagType(root);
  if (type !== TAG.LIST && type !== TAG.COMPOUND){
    throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
  }

  if (bedrockLevel){
    writer.writeFloat64(0, littleEndian);
  }

  writer.writeUint8(type);
  if (rootName !== null) writeString(writer, rootName, littleEndian);
  writeTag(writer, root as RootTag, littleEndian);

  if (bedrockLevel){
    if (littleEndian !== true){
      throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
    }
    if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)){
      throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
    }
    const version: number = root["StorageVersion"].valueOf();
    const byteLength = writer.byteOffset - 8;
    writer.view.setUint32(0, version, littleEndian);
    writer.view.setUint32(4, byteLength, littleEndian);
  }

  let result = writer.trimmedEnd();

  if (compression !== null){
    result = await compress(result,compression);
  }

  return result;
}

function writeTag(writer: DataWriter, value: Tag, littleEndian: boolean): void {
  const type = getTagType(value);
  switch (type){
    case TAG.BYTE: return writeByte(writer, value as ByteTag | BooleanTag);
    case TAG.SHORT: return writeShort(writer, value as ShortTag, littleEndian);
    case TAG.INT: return writeInt(writer, value as IntTag, littleEndian);
    case TAG.LONG: return writeLong(writer, value as LongTag, littleEndian);
    case TAG.FLOAT: return writeFloat(writer, value as FloatTag, littleEndian);
    case TAG.DOUBLE: return writeDouble(writer, value as DoubleTag, littleEndian);
    case TAG.BYTE_ARRAY: return writeByteArray(writer, value as ByteArrayTag, littleEndian);
    case TAG.STRING: return writeString(writer, value as StringTag, littleEndian);
    case TAG.LIST: return writeList(writer, value as ListTag<Tag>, littleEndian);
    case TAG.COMPOUND: return writeCompound(writer, value as CompoundTag, littleEndian);
    case TAG.INT_ARRAY: return writeIntArray(writer, value as IntArrayTag, littleEndian);
    case TAG.LONG_ARRAY: return writeLongArray(writer, value as LongArrayTag, littleEndian);
  }
}

function writeByte(writer: DataWriter, value: ByteTag | BooleanTag): void {
  writer.writeInt8(Number(value.valueOf()));
}

function writeShort(writer: DataWriter, value: ShortTag, littleEndian: boolean): void {
  writer.writeInt16(value.valueOf(), littleEndian);
}

function writeInt(writer: DataWriter, value: IntTag, littleEndian: boolean): void {
  writer.writeInt32(value.valueOf(), littleEndian);
}

function writeLong(writer: DataWriter, value: LongTag, littleEndian: boolean): void {
  writer.writeBigInt64(value, littleEndian);
}

function writeFloat(writer: DataWriter, value: FloatTag, littleEndian: boolean): void {
  writer.writeFloat32(value.valueOf(), littleEndian);
}

function writeDouble(writer: DataWriter, value: DoubleTag, littleEndian: boolean): void {
  writer.writeFloat64(value, littleEndian);
}

function writeByteArray(writer: DataWriter, value: ByteArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt8Array(value);
}

function writeString(writer: DataWriter, value: StringTag, littleEndian: boolean): void {
  writer.writeUint16(Buffer.from(value).byteLength, littleEndian);
  writer.writeString(value);
}

function writeList(writer: DataWriter, value: ListTag<Tag>, littleEndian: boolean): void {
  let type: TAG | undefined = value[TAG_TYPE];
  value = value.filter(isTag);
  type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
  const { length } = value;
  writer.writeUint8(type);
  writer.writeInt32(length, littleEndian);
  for (const entry of value){
    if (getTagType(entry) !== type){
      throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
    }
    writeTag(writer, entry, littleEndian);
  }
}

function writeCompound(writer: DataWriter, value: CompoundTag, littleEndian: boolean): void {
  for (const [name,entry] of Object.entries(value)){
    if (entry === undefined) continue;
    const type = getTagType(entry as unknown);
    if (type === null) continue;
    writer.writeUint8(type);
    writeString(writer, name, littleEndian);
    writeTag(writer, entry, littleEndian);
  }
  writer.writeUint8(TAG.END);
}

function writeIntArray(writer: DataWriter, value: IntArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeInt32Array(value, littleEndian);
}

function writeLongArray(writer: DataWriter, value: LongArrayTag, littleEndian: boolean): void {
  const { length } = value;
  writer.writeInt32(length, littleEndian);
  writer.writeBigInt64Array(value, littleEndian);
}

class DataWriter {
  byteOffset: number;
  data: Uint8Array;
  view: DataView;
  encoder: TextEncoder;

  constructor() {
    this.byteOffset = 0;
    this.data = new Uint8Array(1024);
    this.view = new DataView(this.data.buffer);
    this.encoder = new TextEncoder();
  }

  writeUint8(value: number): void {
    this.write("Uint8", value);
  }

  writeInt8(value: number): void {
    this.write("Int8", value);
  }

  writeUint16(value: number, littleEndian: boolean): void {
    this.write("Uint16", value, littleEndian);
  }

  writeInt16(value: number, littleEndian: boolean): void {
    this.write("Int16", value, littleEndian);
  }

  writeUint32(value: number, littleEndian: boolean): void {
    this.write("Uint32", value, littleEndian);
  }

  writeInt32(value: number, littleEndian: boolean): void {
    this.write("Int32", value, littleEndian);
  }

  writeFloat32(value: number, littleEndian: boolean): void {
    this.write("Float32", value, littleEndian);
  }

  writeFloat64(value: number, littleEndian: boolean): void {
    this.write("Float64", value, littleEndian);
  }

  writeBigUint64(value: bigint, littleEndian: boolean): void {
    this.write("BigUint64", value, littleEndian);
  }

  writeBigInt64(value: bigint, littleEndian: boolean): void {
    this.write("BigInt64", value, littleEndian);
  }

  private write<T extends Extract<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>): void;
  private write<T extends Exclude<keyof typeof ByteType, "Uint8" | "Int8">>(type: T, value: ReturnType<DataView[`get${T}`]>, littleEndian: boolean): void;
  private write(type: keyof typeof ByteType, value: number | bigint, littleEndian?: boolean): void {
    this.allocate(ByteType[type]);
    this.view[`set${type}`]((this.byteOffset += ByteType[type]) - ByteType[type], value as never, littleEndian);
  }

  writeInt8Array(value: Int8Array | Uint8Array): void {
    const { length } = value;
    this.allocate(length);
    this.data.set(value,this.byteOffset);
    this.byteOffset += length;
  }

  writeString(value: StringTag): void {
    const entry = this.encoder.encode(value);
    const { length } = entry;
    this.allocate(length);
    this.data.set(entry,this.byteOffset);
    this.byteOffset += length;
  }

  writeInt32Array(value: Int32Array | Uint32Array, littleEndian: boolean): void {
    for (const entry of value){
      this.writeInt32(entry, littleEndian);
    }
  }

  writeBigInt64Array(value: BigInt64Array | BigUint64Array, littleEndian: boolean): void {
    for (const entry of value){
      this.writeBigInt64(entry, littleEndian);
    }
  }

  trimmedEnd(): Uint8Array {
    this.allocate(0);
    return this.data.slice(0,this.byteOffset);
  }

  private allocate(byteLength: number): void {
    const required = this.byteOffset + byteLength;
    if (this.data.byteLength >= required) return;

    let length = this.data.byteLength;

    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.data, 0);

    // not sure this is really needed, keeping it just in case; freezer burn
    if (this.byteOffset > this.data.byteLength){
      data.fill(0, byteLength, this.byteOffset);
    }

    this.data = data;
    this.view = new DataView(data.buffer);
  }
}

// data-backing (I want to move the readers/writers here too)

enum ByteType {
  Uint8 = 1,
  Int8 = 1,
  Uint16 = 2,
  Int16 = 2,
  Uint32 = 4,
  Int32 = 4,
  Float32 = 4,
  Float64 = 8,
  BigUint64 = 8,
  BigInt64 = 8,
}

// compression

export async function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const compressionStream = new CompressionStream(format);
  return pipeThroughCompressionStream(data,compressionStream);
}

export async function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream(format);
  return pipeThroughCompressionStream(data,decompressionStream);
}

async function pipeThroughCompressionStream(data: Uint8Array, { readable, writable }: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = writable.getWriter();

  writer.write(data).catch(() => {});
  writer.close().catch(() => {});

  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  const generator = (Symbol.asyncIterator in readable) ? readable : readableStreamToAsyncGenerator(readable as ReadableStream<Uint8Array>);

  for await (const chunk of generator){
    chunks.push(chunk);
    byteLength += chunk.byteLength;
  }

  const result = new Uint8Array(byteLength);
  let byteOffset = 0;

  for (const chunk of chunks){
    result.set(chunk,byteOffset);
    byteOffset += chunk.byteLength;
  }

  return result;
}

async function* readableStreamToAsyncGenerator<T>(readable: ReadableStream<T>): AsyncGenerator<T,void,void> {
  const reader = readable.getReader();
  try {
    while (true){
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// tag

export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

export type RootTag = CompoundTag | ListTag<Tag>;

export type RootTagLike = CompoundTagLike | ListTagLike;

export type ByteTag<T extends number = number> = Int8<NumberLike<T>>;

export type BooleanTag = FalseTag | TrueTag;

export type FalseTag = false | ByteTag<0>;

export type TrueTag = true | ByteTag<1>;

export type ShortTag<T extends number = number> = Int16<NumberLike<T>>;

export type IntTag<T extends number = number> = Int32<NumberLike<T>>;

export type LongTag<T extends bigint = bigint> = T;

export type FloatTag<T extends number = number> = Float32<NumberLike<T>>;

export type DoubleTag<T extends number = number> = NumberLike<T>;

export type ByteArrayTag = Int8Array | Uint8Array;

export type StringTag<T extends string = string> = StringLike<T>;

export interface ListTag<T extends Tag | undefined> extends Array<T> {
  [TAG_TYPE]?: TAG;
}

export type ListTagLike = any[];

export interface CompoundTag {
  [name: string]: Tag | undefined;
}

export type CompoundTagLike = object;

export type IntArrayTag = Int32Array | Uint32Array;

export type LongArrayTag = BigInt64Array | BigUint64Array;

export type NumberLike<T extends number> = `${T}` extends `${infer N extends number}` ? N : never;

export type StringLike<T extends string> = `${T}`;

export enum TAG {
  END = 0,
  BYTE,
  SHORT,
  INT,
  LONG,
  FLOAT,
  DOUBLE,
  BYTE_ARRAY,
  STRING,
  LIST,
  COMPOUND,
  INT_ARRAY,
  LONG_ARRAY
}

Object.freeze(TAG);

export const TAG_TYPE = Symbol("nbtify.tag.type");

export function isTag<T extends Tag>(value: any): value is T {
  return getTagType(value) !== null;
}

export function getTagType(value: Tag): TAG;
export function getTagType(value: any): TAG | null;
export function getTagType(value: any): TAG | null {
  switch (true){
    case value instanceof Int8:
    case typeof value === "boolean": return TAG.BYTE;
    case value instanceof Int16: return TAG.SHORT;
    case value instanceof Int32: return TAG.INT;
    case typeof value === "bigint": return TAG.LONG;
    case value instanceof Float32: return TAG.FLOAT;
    case typeof value === "number": return TAG.DOUBLE;
    case value instanceof Int8Array:
    case value instanceof Uint8Array: return TAG.BYTE_ARRAY;
    case typeof value === "string": return TAG.STRING;
    case value instanceof Array: return TAG.LIST;
    case value instanceof Int32Array:
    case value instanceof Uint32Array: return TAG.INT_ARRAY;
    case value instanceof BigInt64Array:
    case value instanceof BigUint64Array: return TAG.LONG_ARRAY;
    case typeof value === "object" && value !== null: return TAG.COMPOUND;
    default: return null;
  }
}

// primitive

type CustomInspectFunction = import("node:util").CustomInspectFunction;

const CustomInspect = Symbol.for("nodejs.util.inspect.custom");

export class Int8<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 24 >> 24);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int8" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}b`,"number");
  }
}

export class Int16<T extends number = number> extends Number {
  constructor(value: T) {
    super(value << 16 >> 16);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int16" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}s`,"number");
  }
}

export class Int32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value | 0);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Int32" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return () => this.valueOf();
  }
}

export class Float32<T extends number = number> extends Number {
  constructor(value: T) {
    super(value);
  }

  override valueOf() {
    return super.valueOf() as T;
  }

  get [Symbol.toStringTag]() {
    return "Float32" as const;
  }

  /**
   * @internal
  */
  get [CustomInspect](): CustomInspectFunction {
    return (_,{ stylize }) => stylize(`${this.valueOf()}f`,"number");
  }
}