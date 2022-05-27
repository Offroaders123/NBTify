import { tags, types } from "./tags.js";

export default class Reader {
  constructor(data,endian) {
    if (!data) throw new Error(`Unexpected falsy value for the "data" parameter.`);

    this.offset = 0;
    this.endian = endian;

    this.arrayView = new Uint8Array(data);
    this.dataView = new DataView(this.arrayView.buffer);
  }
  read(type,size) {
    const value = this.dataView[`get${type}`](this.offset,(this.endian === "little"));
    this.offset += size;
    return value;
  }
  byte() {
    return this.read("Int8",1);
  }
  ubyte() {
    return this.read("Uint8",1);
  }
  short() {
    return this.read("Int16",2);
  }
  int() {
    return this.read("Int32",4);
  }
  float() {
    return this.read("Float32",4);
  }
  double() {
    return this.read("Float64",8);
  }
  long() {
    return [this.int(),this.int()];
  }
  byteArray() {
    const length = this.int();
    const bytes = [];
    for (let i = 0; i < length; i++){
      bytes.push(this.byte());
    }
    return bytes;
  }
  intArray() {
    const length = this.int();
    const ints = [];
    for (let i = 0; i < length; i++){
      ints.push(this.int());
    }
    return ints;
  }
  longArray() {
    const length = this.int();
    const longs = [];
    for (let i = 0; i < length; i++){
      longs.push(this.long());
    }
    return longs;
  }
  string() {
    const length = this.short();
    const slice = this.arrayView.slice(this.offset,this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(slice);
  }
  list() {
    const tag = this.byte();
    const type = types[tag];
    const length = this.int();
    const values = [];
    for (let i = 0; i < length; i++){
      values.push(this[type]());
    }
    return { type, value: values };
  }
  compound() {
    const values = {};
    while (true){
      const tag = this.byte();
      const type = types[tag];
      if (tag === tags.end) break;
      const name = this.string();
      const value = this[type]();
      values[name] = { type, value };
    }
    return values;
  }
}