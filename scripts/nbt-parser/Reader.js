import decodeUTF8 from "./decodeUTF8.js";

import tagTypes from "./tagTypes.js";
import tagTypeNames from "./tagTypeNames.js";

/*
  In addition to the named writing methods documented below,
  the same methods are indexed by the NBT type number as well,
  as shown in the example below.
*/
export default class Reader {
  constructor(buffer){
    if (!buffer) throw new Error(`Argument "buffer" is falsy`);

    /*
      The current location in the buffer. Can be freely
      changed within the bounds of the buffer.
    */
    this.offset = 0;

    const arrayView = new Uint8Array(buffer);
    const dataView = new DataView(buffer);

    const read = (dataType,size) => {
      const value = dataView[`get${dataType}`](this.offset);
      this.offset += size;
      return value;
    };

    /* read byte */
    this.byte = read.bind(this,"Int8",1);

    /* read unsigned byte */
    this.ubyte = read.bind(this,"Uint8",1);

    /* read signed 16-bit short */
    this.short = read.bind(this,"Int16",2);

    /* read signed 32-bit integer */
    this.int = read.bind(this,"Int32",4);

    /* read signed 32-bit float */
    this.float = read.bind(this,"Float32",4);

    /* read signed 64-bit float */
    this.double = read.bind(this,"Float64",8);

    /*
      As JavaScript does not not natively support 64-bit
      integers, the value is returned as an array of two
      32-bit integers, the upper and the lower.
    */
    this.long = () => [this.int(),this.int()];

    /* read array */
    this.byteArray = () => {
      const length = this.int();
      const bytes = [];
      for (let i = 0; i < length; i++) bytes.push(this.byte());
      return bytes;
    };

    /* read array of 32-bit ints */
    this.intArray = () => {
      const length = this.int();
      const ints = [];
      for (let i = 0; i < length; i++) ints.push(this.int());
      return ints;
    };

    /*
      As JavaScript does not not natively support 64-bit
      integers, the value is returned as an array of arrays of two
      32-bit integers, the upper and the lower.
    */
    /* read array of 64-bit ints */
    this.longArray = () => {
      const length = this.int();
      const longs = [];
      for (let i = 0; i < length; i++) longs.push(this.long());
      return longs;
    };

    /* read string */
    this.string = () => {
      const length = this.short();
      const slice = arrayView.slice(this.offset,this.offset + length);
      this.offset += length;
      return decodeUTF8(slice);
    };

    this.list = () => {
      const type = this.byte();
      const length = this.int();
      const values = [];
      for (let i = 0; i < length; i++) values.push(this[type]());
      return {
        type: tagTypeNames[type],
        value: values
      };
    };

    this.compound = () => {
      const values = {};
      while (true){
        const type = this.byte();
        if (type === tagTypes.end) break;
        const name = this.string();
        const value = this[type]();
        values[name] = {
          type: tagTypeNames[type],
          value
        };
      }
      return values;
    };

    for (let type in tagTypeNames){
      if (tagTypeNames.hasOwnProperty(type)) this[type] = this[tagTypeNames[type]];
    }
  }
}