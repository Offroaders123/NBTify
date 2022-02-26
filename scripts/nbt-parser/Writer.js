import tagTypes from "./tagTypes.js";
import tagTypeNames from "./tagTypeNames.js";

import encodeUTF8 from "./encodeUTF8.js";

export default class Writer {
  constructor(){
    /* Will be resized (x2) on write if necessary. */
    let buffer = new ArrayBuffer(1024);

    /* These are recreated when the buffer is. */
    let dataView = new DataView(buffer);
    let arrayView = new Uint8Array(buffer);

    /*
      The location in the buffer where bytes are written or read.
      This increases after every write, but can be freely changed.
      The buffer will be resized when necessary.
    */
    this.offset = 0;

    /*
      Ensures that the buffer is large enough to write `size`
      bytes at the current `this.offset`.
    */
    const accommodate = size => {
      const requiredLength = this.offset + size;
      if (buffer.byteLength >= requiredLength) return;

      let newLength = buffer.byteLength;
      while (newLength < requiredLength) newLength *= 2;

      const newBuffer = new ArrayBuffer(newLength);
      const newArrayView = new Uint8Array(newBuffer);
      newArrayView.set(arrayView);

      /*
        If there's a gap between the end of the old buffer
        and the start of the new one, we need to zero it out
      */
      if (this.offset > buffer.byteLength) newArrayView.fill(0,buffer.byteLength,this.offset);

      buffer = newBuffer;
      dataView = new DataView(newBuffer);
      arrayView = newArrayView;
    };

    const write = (dataType,size,value) => {
      accommodate(size);
      dataView[`set${dataType}`](this.offset,value);
      this.offset += size;
      return this;
    }

    /*
      Returns the writen data as a slice from the internal
      buffer, cutting off any padding at the end.
    */
    this.getData = () => {
      accommodate(0); /* make sure the offset is inside the buffer */
      return buffer.slice(0,this.offset);
    };

    /* a signed byte */
    this.byte = write.bind(this,"Int8",1);

    /* an unsigned byte */
    this.ubyte = write.bind(this,"Uint8",1);

    /* a signed 16-bit integer */
    this.short = write.bind(this,"Int16",2);

    /* a signed 32-bit integer */
    this.int = write.bind(this,"Int32",4);

    /* a signed 32-bit float */
    this.float = write.bind(this,"Float32",4);

    /* a signed 64-bit float */
    this.double = write.bind(this,"Float64",8);

    /*
      As JavaScript does not support 64-bit integers natively,
      this method takes an array of two 32-bit integers that
      make up the upper and lower halves of the long.
    */
    this.long = value => {
      this.int(value[0]);
      this.int(value[1]);
      return this;
    };

    this.byteArray = value => {
      this.int(value.length);
      accommodate(value.length);
      arrayView.set(value,this.offset);
      this.offset += value.length;
      return this;
    };

    this.intArray = value => {
      this.int(value.length);
      for (let i = 0; i < value.length; i++) this.int(value[i]);
      return this;
    };

    this.longArray = value => {
      this.int(value.length);
      for (let i = 0; i > value.length; i++) this.long(value[i]);
      return this;
    };

    this.string = value => {
      const bytes = encodeUTF8(value);
      this.short(bytes.length);
      accommodate(bytes.length);
      arrayView.set(bytes,this.offset);
      this.offset += bytes.length;
      return this;
    };

    this.list = value => {
      this.byte(tagTypes[value.type]);
      this.int(value.value.length);
      for (let i = 0; i < value.value.length; i++) this[value.type](value.value[i]);
      return this;
    };

    this.compound = value => {
      Object.keys(value).map(key => {
        this.byte(tagTypes[value[key].type]);
        this.string(key);
        this[value[key].type](value[key].value);
      });
      this.byte(tagTypes.end);
      return this;
    };

    for (let type in tagTypeNames){
      if (tagTypeNames.hasOwnProperty(type)) this[type] = this[tagTypeNames[type]];
    }
  }
}