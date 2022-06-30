import { tags } from "./tags.js";
import { compress } from "./compression.js";

export default async function write(data,{ endian = "big", encoding } = {}){
  if (typeof data !== "object"){
    throw new Error("First argument must be an object");
  }
  if (endian !== "big" && endian !== "little"){
    throw new Error(`Endian property must be set to either "big" or "little"`);
  }

  const writer = new Writer(endian);
  const { name, value } = data;

  writer.byte(tags.compound);
  writer.string(name);
  writer.compound(value);

  let result = writer.getData();
  if (encoding !== undefined){
    result = await compress(result,{ encoding });
  }

  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}

class Writer {
  constructor(endian) {
    if (endian !== "big" && endian !== "little"){
      throw new Error(`First argument must be set to either "big" or "little"`);
    }
  
    this.offset = 0;
    this.endian = (endian === "little");

    this.buffer = new ArrayBuffer(1024);
    this.view = new DataView(this.buffer);
    this.data = new Uint8Array(this.buffer);
  }
  accommodate(size) {
    const required = this.offset + size;
    const { byteLength } = this.buffer;
    if (byteLength >= required) return;

    let length = byteLength;
    while (length < required){
      length *= 2;
    }

    const buffer = new ArrayBuffer(length);
    const data = new Uint8Array(buffer);
    data.set(this.data);

    if (this.offset > byteLength){
      data.fill(0,byteLength,this.offset);
    }

    this.buffer = buffer;
    this.data = data;
    this.view = new DataView(this.buffer);
  }
  getData() {
    this.accommodate(0);
    const result = this.buffer.slice(0,this.offset);
    return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
  }
  byte(value) {
    this.accommodate(1);
    this.view.setInt8(this.offset,value);
    this.offset += 1;
  }
  short(value) {
    this.accommodate(2);
    this.view.setInt16(this.offset,value,this.endian);
    this.offset += 2;
  }
  int(value) {
    this.accommodate(4);
    this.view.setInt32(this.offset,value,this.endian);
    this.offset += 4;
  }
  float(value) {
    this.accommodate(4);
    this.view.setFloat32(this.offset,value,this.endian);
    this.offset += 4;
  }
  double(value) {
    this.accommodate(8);
    this.view.setFloat64(this.offset,value,this.endian);
    this.offset += 8;
  }
  long(value) {
    this.accommodate(8);
    this.view.setBigInt64(this.offset,value,this.endian);
    this.offset += 8;
  }
  byteArray(value) {
    const { length } = value;
    this.accommodate(length);
    this.data.set(value,this.offset);
    this.offset += length;
  }
  intArray(value) {
    const { length } = value;
    this.int(length);
    for (const entry of value){
      this.int(entry);
    }
  }
  longArray(value) {
    const { length } = value;
    this.int(length);
    for (const entry of value){
      this.long(entry);
    }
  }
  string(value) {
    value = new TextEncoder().encode(value);
    const { length } = value;
    this.short(length);
    this.accommodate(length);
    this.data.set(value,this.offset);
    this.offset += length;
  }
  list(value) {
    const { type } = value;
    const tag = tags[type];
    const entries = value.value;
    const { length } = entries;
    this.byte(tag);
    this.int(length);
    for (const entry of entries){
      this[type](entry);
    }
  }
  compound(value) {
    for (const key in value){
      const entry = value[key];
      const { type } = entry;
      const tag = tags[type];
      this.byte(tag);
      this.string(key);
      this[type](entry.value);
    }
    this.byte(tags.end);
  }
}