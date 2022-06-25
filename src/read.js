import { tags, types } from "./tags.js";
import { decompress } from "./compression.js";

export default async function read(data,{ endian } = {}){
  if (!data) throw new Error("Unexpected falsy value for the data parameter");

  if (typeof endian !== "undefined" && !["big","little"].includes(endian)){
    throw new Error("Unexpected endian type");
  }

  if (endian !== "big" && hasBedrockLevelHeader(data)){
    data = data.slice(8);
    endian = "little";
  }

  if (typeof endian !== "undefined"){
    try {
      const result = await runReader(data,endian);
      return result;
    } catch (error){
      throw error;
    }
  } else {
    let result = null;
    try {
      result = await runReader(data,"big");
    } catch (error){
      try {
        result = await runReader(data,"little");
      } catch {
        throw error;
      }
    }
    return result;
  }
}

async function runReader(data,endian){
  if (hasGzipHeader(data)) data = await decompress(data,{ encoding: "gzip" });

  const reader = new Reader(data,endian);
  const compound = reader.byte();
  if (compound !== tags.compound) throw new Error("Top tag must be a compound");

  return { name: reader.string(), type: "compound", value: reader.compound() };
}

function hasBedrockLevelHeader(data){
  const header = new Uint8Array(data.slice(0,4));
  const result = (header[1] === 0 && header[2] === 0 && header[3] === 0);
  return result;
}

function hasGzipHeader(data){
  const header = new Uint8Array(data.slice(0,2));
  const result = (header[0] === 0x1f && header[1] === 0x8b);
  return result;
}

class Reader {
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
    return this.read("BigInt64",8);
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