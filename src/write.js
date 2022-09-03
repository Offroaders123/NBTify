/**
 * @typedef { import("./tags.js").Tag } Tag
 * @typedef { import("./tags.js").TagByte } TagByte
*/

import { EndTag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tags.js";
import { compress } from "./compression.js";

/**
 * The user-facing function to write bytes to an NBT byte stream.
 * 
 * If an endian format is not specified, the function will default to
 * writing the byte stream as big endian.
 * 
 * If a compression format format is not specified, the function will
 * return the raw uncompressed byte stream, as is.
 * 
 * @param { CompoundTag } data
 * @param { { endian?: "big" | "little"; format?: "gzip" | "deflate" | "deflate-raw"; } | undefined } options
*/
export async function write(data,{ endian = "big", format } = {}){
  if (!(data instanceof CompoundTag)){
    throw new TypeError(`First argument must be a CompoundTag, received ${typeof data}`);
  }
  if (endian !== "big" && endian !== "little"){
    throw new TypeError(`Endian option must be set to either "big" or "little"`);
  }

  const writer = new Writer();
  let result = writer.write(data,{ endian });

  if (format !== undefined){
    result = await compress(result,{ format });
  }

  return result;
}

/**
 * The bare-bones implementation to write data to an NBT byte stream.
*/
export class Writer {
  #offset = 0;
  #littleEndian = false;
  #buffer = new ArrayBuffer(1024);
  #data = new Uint8Array(this.#buffer);
  #view = new DataView(this.#buffer);

  /**
   * Top-level function to initiate the NBT writer on a provided `CompoundTag`.
   * 
   * Defaults to writing the byte stream as big endian.
   * 
   * @param { CompoundTag } data
   * @param { { endian?: "big" | "little"; } | undefined } options
  */
  write(data,{ endian = "big" } = {}) {
    if (!(data instanceof CompoundTag)){
      throw new TypeError(`First argument must be a CompoundTag, received type ${typeof data}`);
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError(`Endian option must be set to either "big" or "little"`);
    }

    this.#offset = 0;
    this.#littleEndian = (endian === "little");
    this.#buffer = new ArrayBuffer(1024);
    this.#data = new Uint8Array(this.#buffer);
    this.#view = new DataView(this.#buffer);

    const { name } = data;
    const value = data.valueOf();
    
    this.#setTagByte(CompoundTag.TAG_BYTE);
    this.#setString(name || "");
    this.#setCompound(value);

    this.#accommodate(0);
    const result = this.#data.slice(0,this.#offset);
    return new Uint8Array(result);
  }

  /**
   * Increases the byte length of the byte stream to the minimum
   * length that will be able to hold the length passed in.
   * 
   * @param { number } size
  */
  #accommodate(size) {
    const required = this.#offset + size;
    const { byteLength } = this.#buffer;
    if (byteLength >= required) return;

    let length = byteLength;
    while (length < required){
      length *= 2;
    }

    const data = new Uint8Array(length);
    data.set(this.#data);

    if (this.#offset > byteLength){
      data.fill(0,byteLength,this.#offset);
    }

    this.#buffer = data.buffer;
    this.#view = new DataView(this.#buffer);
    this.#data = data;
  }

  /**
   * Writes the tag byte value at the writer's current offset position.
   * 
   * @param { TagByte } value
  */
  #setTagByte(value) {
    this.#setUint8(value);
  }

  /**
   * Writes the tag at the reader's current offset position.
   * 
   * @param { Tag } tag
  */
  #setTag(tag) {
    switch (true){
      case tag instanceof ByteTag: return this.#setByteTag(/** @type { ByteTag } */ (tag));
      case tag instanceof ShortTag: return this.#setShortTag(/** @type { ShortTag } */ (tag));
      case tag instanceof IntTag: return this.#setIntTag(/** @type { IntTag } */ (tag));
      case tag instanceof LongTag: return this.#setLongTag(/** @type { LongTag } */ (tag));
      case tag instanceof FloatTag: return this.#setFloatTag(/** @type { FloatTag } */ (tag));
      case tag instanceof DoubleTag: return this.#setDoubleTag(/** @type { DoubleTag } */ (tag));
      case tag instanceof ByteArrayTag: return this.#setByteArrayTag(/** @type { ByteArrayTag } */ (tag));
      case tag instanceof StringTag: return this.#setStringTag(/** @type { StringTag } */ (tag));
      case tag instanceof ListTag: return this.#setListTag(/** @type { ListTag } */ (tag));
      case tag instanceof CompoundTag: return this.#setCompoundTag(/** @type { CompoundTag } */ (tag));
      case tag instanceof IntArrayTag: return this.#setIntArrayTag(/** @type { IntArrayTag } */ (tag));
      case tag instanceof LongArrayTag: return this.#setLongArrayTag(/** @type { LongArrayTag } */ (tag));
    }
  }

  /**
   * @param { ByteTag } tag
  */
  #setByteTag(tag) {
    const value = tag.valueOf();
    this.#setInt8(value);
  }
  
  /**
   * @param { ShortTag } tag
  */
  #setShortTag(tag) {
    const value = tag.valueOf();
    this.#setInt16(value);
  }
  
  /**
   * @param { IntTag } tag
  */
  #setIntTag(tag) {
    const value = tag.valueOf();
    this.#setInt32(value);
  }

  /**
   * @param { LongTag } tag
  */
  #setLongTag(tag) {
    const value = tag.valueOf();
    this.#setBigInt64(value);
  }
  
  /**
   * @param { FloatTag } tag
  */
  #setFloatTag(tag) {
    const value = tag.valueOf();
    this.#setFloat32(value);
  }

  /**
   * @param { DoubleTag } tag
  */
  #setDoubleTag(tag) {
    const value = tag.valueOf();
    this.#setFloat64(value);
  }

  /**
   * @param { ByteArrayTag } tag
  */
  #setByteArrayTag(tag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setUint8Array(value);
  }

  /**
   * @param { StringTag } tag
  */
  #setStringTag(tag) {
    const value = tag.valueOf();
    this.#setString(value);
  }

  /**
   * @param { ListTag } tag
  */
  #setListTag(tag) {
    const value = tag.valueOf();
    this.#setList(value);
  }

  /**
   * @param { CompoundTag } tag
  */
  #setCompoundTag(tag) {
    const value = tag.valueOf();
    this.#setCompound(value);
  }

  /**
   * @param { IntArrayTag } tag
  */
  #setIntArrayTag(tag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setInt32Array(value);
  }

  /**
   * @param { LongArrayTag } tag
  */
  #setLongArrayTag(tag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setBigInt64Array(value);
  }

  /**
   * @param { number } value
  */
  #setUint8(value) {
    this.#accommodate(1);
    this.#view.setUint8(this.#offset,value);
    this.#offset += 1;
  }

  /**
   * Commonly used to write Byte tags.
   * 
   * @param { number } value
  */
  #setInt8(value) {
    this.#accommodate(1);
    this.#view.setInt8(this.#offset,value);
    this.#offset += 1;
  }

  /**
   * @param { number } value
  */
  #setUint16(value) {
    this.#accommodate(2);
    this.#view.setUint16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  /**
   * Commonly used to write Short tags.
   * 
   * @param { number } value
  */
  #setInt16(value) {
    this.#accommodate(2);
    this.#view.setInt16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  /**
   * @param { number } value
  */
  #setUint32(value) {
    this.#accommodate(4);
    this.#view.setUint32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Int tags.
   * 
   * @param { number } value
  */
  #setInt32(value) {
    this.#accommodate(4);
    this.#view.setInt32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Float tags.
   * 
   * @param { number } value
  */
  #setFloat32(value) {
    this.#accommodate(4);
    this.#view.setFloat32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Double tags.
   * 
   * @param { number } value
  */
  #setFloat64(value) {
    this.#accommodate(8);
    this.#view.setFloat64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  /**
   * Commonly used to read Long tags.
   * 
   * @param { bigint } value
  */
  #setBigInt64(value) {
    this.#accommodate(8);
    this.#view.setBigInt64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  /**
   * Commonly used to write ByteArray tags.
   * 
   * @param { Uint8Array } value
  */
  #setUint8Array(value) {
    const { byteLength } = value;
    this.#accommodate(byteLength);
    this.#data.set(value,this.#offset);
    this.#offset += byteLength;
  }

  /**
   * Commonly used to write IntArray tags.
   * 
   * @param { Int32Array } value
  */
  #setInt32Array(value) {
    for (const entry of value){
      this.#setInt32(entry);
    }
  }

  /**
   * Commonly used to write LongArray tags.
   * 
   * @param { BigInt64Array } value
  */
  #setBigInt64Array(value) {
    for (const entry of value){
      this.#setBigInt64(entry);
    }
  }

  /**
   * Commonly used to write String tags.
   * 
   * @param { string } value
  */
  #setString(value) {
    const entry = new TextEncoder().encode(value);
    const { length } = entry;
    this.#setUint16(length);
    this.#accommodate(length);
    this.#data.set(entry,this.#offset);
    this.#offset += length;
  }

  /**
   * Exclusively used to write List tags.
   * 
   * @param { Tag[] } value
  */
  #setList(value) {
    /** @type { TagByte } */
    const tag = /** @type { any } */ (value[0].constructor).TAG_BYTE;
    const { length } = value;
    this.#setTagByte(tag);
    this.#setUint32(length);
    for (const entry of value){
      this.#setTag(entry);
    }
  }

  /**
   * Exclusively used to write Compound tags.
   * 
   * @param { { [name: string]: Tag } } value
  */
  #setCompound(value) {
    for (const [name,entry] of Object.entries(value)){
      /** @type { TagByte } */
      const tag = /** @type { any } */ (entry.constructor).TAG_BYTE;
      this.#setTagByte(tag);
      this.#setString(name);
      this.#setTag(entry);
    }
    this.#setTagByte(EndTag.TAG_BYTE);
  }
}