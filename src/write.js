import { tags } from "./tags.js";
import { compress } from "./compression.js";

export default async function write(data,{ endian, encoding } = {}){
  if (!data) throw new Error("Unexpected falsy value for the data parameter");

  const writer = new Writer(endian);

  writer.byte(tags.compound);
  writer.string(data.name);
  writer.compound(data.value);

  let result = writer.getData();

  if (typeof encoding !== "undefined"){
    result = await compress(result,{ encoding });
  }
  return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
}

class Writer {
  constructor(endian) {
    this.buffer = new ArrayBuffer(1024);

    this.dataView = new DataView(this.buffer);
    this.arrayView = new Uint8Array(this.buffer);

    this.offset = 0;

    this.endian = endian;
  }
  accommodate(size) {
    const requiredLength = this.offset + size;
    if (this.buffer.byteLength >= requiredLength) return;

    let newLength = this.buffer.byteLength;
    while (newLength < requiredLength) newLength *= 2;

    const newBuffer = new ArrayBuffer(newLength);
    const newArrayView = new Uint8Array(newBuffer);
    newArrayView.set(this.arrayView);

    if (this.offset > this.buffer.byteLength) newArrayView.fill(0,this.buffer.byteLength,this.offset);

    this.buffer = newBuffer;
    this.dataView = new DataView(newBuffer);
    this.arrayView = newArrayView;
  }
  write(type,size,value) {
    this.accommodate(size);
    this.dataView[`set${type}`](this.offset,value,(this.endian === "little"));
    this.offset += size;
    return this;
  }
  getData() {
    this.accommodate(0);
    const result = this.buffer.slice(0,this.offset);
    return typeof Buffer !== "undefined" ? Buffer.from(result) : result;
  }
  byte(value) {
    return this.write("Int8",1,value);
  }
  ubyte(value) {
    return this.write("Uint8",1,value);
  }
  short(value) {
    return this.write("Int16",2,value);
  }
  int(value) {
    return this.write("Int32",4,value);
  }
  float(value) {
    return this.write("Float32",4,value);
  }
  double(value) {
    return this.write("Float64",8,value);
  }
  long(value) {
    return this.write("BigInt64",8,value);
  }
  byteArray(value) {
    this.int(value.length);
    this.accommodate(value.length);
    this.arrayView.set(value,this.offset);
    this.offset += value.length;
    return this;
  }
  intArray(value) {
    this.int(value.length);
    for (let i = 0; i < value.length; i++){
      this.int(value[i]);
    }
    return this;
  }
  longArray(value) {
    this.int(value.length);
    for (let i = 0; i < value.length; i++){
      this.long(value[i]);
    }
    return this;
  }
  string(value) {
    const bytes = new TextEncoder().encode(value);
    this.short(bytes.length);
    this.accommodate(bytes.length);
    this.arrayView.set(bytes,this.offset);
    this.offset += bytes.length;
    return this;
  }
  list(value) {
    this.byte(tags[value.type]);
    this.int(value.value.length);
    for (let i = 0; i < value.value.length; i++){
      this[value.type](value.value[i]);
    }
  }
  compound(value) {
    for (const key in value){
      this.byte(tags[value[key].type]);
      this.string(key);
      this[value[key].type](value[key].value);
    }
    this.byte(tags.end);
    return this;
  }
}