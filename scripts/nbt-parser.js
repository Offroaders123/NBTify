/*
  NBT Parser.js - a JavaScript parser for NBT archives
  based on NBT.js by Sijmen Mulder, a modern fork by Brandon Bennett
*/

/* A mapping from type names to NBT type numbers. */
export const tagTypes = {
  "end": 0,
  "byte": 1,
  "short": 2,
  "int": 3,
  "long": 4,
  "float": 5,
  "double": 6,
  "byteArray": 7,
  "string": 8,
  "list": 9,
  "compound": 10,
  "intArray": 11,
  "longArray": 12
};

/* A mapping from NBT type numbers to type names. */
export const tagTypeNames = Object.fromEntries(Object.entries(tagTypes).map(array => array.reverse()));

function hasGzipHeader(data){
  const head = new Uint8Array(data.slice(0,2));
  return (head.length === 2 && head[0] === 0x1f && head[1] === 0x8b);
}

function encodeUTF8(string){
  const array = [];
  for (char of string){
    char = char.charCodeAt(0);
    if (char < 0x80){
      array.push(char);
    } else if (char < 0x800){
      array.push(0xC0 | char >> 6);
      array.push(0x80 | char         & 0x3F);
    } else if (char < 0x10000){
      array.push(0xE0 |  char >> 12);
      array.push(0x80 | (char >>  6) & 0x3F);
      array.push(0x80 |  char        & 0x3F);
    } else {
      array.push(0xF0 | (char >> 18) & 0x07);
      array.push(0x80 | (char >> 12) & 0x3F);
      array.push(0x80 | (char >>  6) & 0x3F);
      array.push(0x80 |  char        & 0x3F);
    }
  }
  return array;
}

function decodeUTF8(array){
  const codepoints = [];
  for (let i = 0; i < array.length; i++){
    if ((array[i] & 0x80) === 0){
      codepoints.push(array[i] & 0x7F);
    } else if (i + 1 < array.length &&
          (array[i]     & 0xE0) === 0xC0 &&
          (array[i + 1] & 0xC0) === 0x80){
      codepoints.push(
        ((array[i]     & 0x1F) << 6) |
        ( array[i + 1] & 0x3F));
    } else if (i + 2 < array.length &&
          (array[i]     & 0xF0) === 0xE0 &&
          (array[i + 1] & 0xC0) === 0x80 &&
          (array[i + 2] & 0xC0) === 0x80){
      codepoints.push(
        ((array[i]     & 0x0F) << 12) |
        ((array[i + 1] & 0x3F) <<  6) |
        ( array[i + 2] & 0x3F));
    } else if (i + 3 < array.length &&
          (array[i]     & 0xF8) === 0xF0 &&
          (array[i + 1] & 0xC0) === 0x80 &&
          (array[i + 2] & 0xC0) === 0x80 &&
          (array[i + 3] & 0xC0) === 0x80){
      codepoints.push(
        ((array[i]     & 0x07) << 18) |
        ((array[i + 1] & 0x3F) << 12) |
        ((array[i + 2] & 0x3F) <<  6) |
        ( array[i + 3] & 0x3F));
    }
  }
  return String.fromCharCode(...codepoints);
}

export class Writer {
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

/*
  In addition to the named writing methods documented below,
  the same methods are indexed by the NBT type number as well,
  as shown in the example below.
*/
export class Reader {
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

export function writeUncompressed(value){
  if (!value) throw new Error(`Argument "value" is falsy`);
  const writer = new Writer();

  writer.byte(tagTypes.compound);
  writer.string(value.name);
  writer.compound(value.value);

  return writer.getData();
}

export function parseUncompressed(data){
  if (!data) throw new Error(`Argument "data" is falsy`);

  const reader = new Reader(data);

  const type = reader.byte();
  if (type !== tagTypes.compound) throw new Error("Top tag should be a compound");

  return {
    name: reader.string(),
    value: reader.compound()
  };
}

/*
  This accepts both gzipped and uncompressd NBT archives.
  If the archive is uncompressed, the callback will be
  called directly from this method. For gzipped files, the
  callback is async.

  For use in the browser, window.zlib must be defined to decode
  compressed archives. It will be passed a Buffer if the type is
  available, or an Uint8Array otherwise.
*/
export function parse(data,callback){
  if (!data) throw new Error(`Argument "data" is falsy`);

  if (!hasGzipHeader(data)){
    callback(null,parseUncompressed(data));
  } else if (!zlib){
    callback(new Error("NBT archive is compressed but zlib is not available"),null);
  } else {
    /* zlib.gunzip take a Buffer, at least in Node, so try to convert if possible. */
    const buffer = (data.length) ? data : new Uint8Array(data);
    zlib.gunzip(buffer,(error,uncompressed) => {
      if (error){
        callback(error,null);
      } else {
        callback(null,parseUncompressed(uncompressed));
      }
    });
  }
}