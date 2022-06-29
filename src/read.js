import { tags, types } from "./tags.js";
import { decompress } from "./compression.js";

export default async function read(data,{ endian } = {}){
  if (data instanceof ArrayBuffer === data instanceof Object.getPrototypeOf(Uint8Array)){
    throw new Error("First argument must be either an ArrayBuffer or TypedArray");
  }
  if (endian !== undefined && endian !== "big" && endian !== "little"){
    throw new Error(`Endian property must be set to either "big" or "little"`);
  }

  if (endian !== undefined){
    if (hasBedrockLevelHeader(data) && endian !== "big"){
      data = data.slice(8);
    }
    if (hasGzipHeader(data)){
      data = await decompress(data,{ encoding: "gzip" });
    }

    const reader = new Reader(data,endian);
    const tag = reader.byte();
    if (tag !== tags.compound){
      throw new Error("First byte in buffer must be a compound tag");
    }

    const type = types[tag];
    const name = reader.string();
    const value = reader.compound();

    return { name, type, value };
  } else {
    let result;
    try {
      result = await read(data,{ endian: "big" });
    } catch (error){
      try {
        result = await read(data,{ endian: "little" });
      } catch {
        throw error;
      }
    }
    return result;
  }
}

function hasBedrockLevelHeader(data){
  const header = new Uint8Array(data).slice(1,4).join("");
  return header === "000";
}

function hasGzipHeader(data){
  const header = new DataView(new Uint8Array(data).buffer).getInt16();
  return header === 0x1f8b;
}

class Reader {
  constructor(data,endian) {
    if (data instanceof ArrayBuffer === data instanceof Object.getPrototypeOf(Uint8Array)){
      throw new Error("First argument must be either an ArrayBuffer or TypedArray");
    }
    if (endian !== undefined && endian !== "big" && endian !== "little"){
      throw new Error(`Second argument must be set to either "big" or "little"`);
    }

    this.offset = 0;
    this.endian = (endian === "little");

    this.data = new Uint8Array(data);
    this.view = new DataView(this.data.buffer);
  }
  byte() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }
  short() {
    const value = this.view.getInt16(this.offset,this.endian);
    this.offset += 2;
    return value;
  }
  int() {
    const value = this.view.getInt32(this.offset,this.endian);
    this.offset += 4;
    return value;
  }
  float() {
    const value = this.view.getFloat32(this.offset,this.endian);
    this.offset += 4;
    return value;
  }
  double() {
    const value = this.view.getFloat64(this.offset,this.endian);
    this.offset += 8;
    return value;
  }
  long() {
    const value = this.view.getBigInt64(this.offset,this.endian);
    this.offset += 8;
    return value;
  }
  byteArray() {
    const length = this.int();
    const value = [];
    for (let i = 0; i < length; i++){
      const entry = this.byte();
      value.push(entry);
    }
    return value;
  }
  intArray() {
    const length = this.int();
    const value = [];
    for (let i = 0; i < length; i++){
      const entry = this.int();
      value.push(entry);
    }
    return value;
  }
  longArray() {
    const length = this.int();
    const value = [];
    for (let i = 0; i < length; i++){
      const entry = this.long();
      value.push(entry);
    }
    return value;
  }
  string() {
    const length = this.short();
    const value = this.data.slice(this.offset,this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(value);
  }
  list() {
    const tag = this.byte();
    const type = types[tag];
    const length = this.int();
    const value = [];
    for (let i = 0; i < length; i++){
      const entry = this[type]();
      value.push(entry);
    }
    return { type, value };
  }
  compound() {
    const value = {};
    while (true){
      const tag = this.byte();
      const type = types[tag];
      if (tag === tags.end) break;
      const name = this.string();
      const entry = this[type]();
      value[name] = { type, value: entry };
    }
    return value;
  }
}