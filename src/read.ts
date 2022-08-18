import { Tag, EndTag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tags.js";
import { decompress } from "./compression.js";

/**
 * The bare-bones implementation to read bytes from an NBT byte stream.
*/
export class Reader {
  #offset = 0;
  #littleEndian = false;
  #data = new Uint8Array();
  #view = new DataView(this.#data.buffer);

  /**
   * Top-level function to initiate the NBT reader on a provided Uint8Array.
  */
  read(data: Uint8Array, { endian = "big" }: { endian?: "big" | "little"; } = {}) {
    if (!(data instanceof Uint8Array)){
      throw new Error("First argument must be a Uint8Array");
    }
    if (endian !== "big" && endian !== "little"){
      throw new Error(`Endian option must be set to either "big" or "little"`);
    }

    this.#offset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = data;
    this.#view = new DataView(this.#data.buffer);

    // const tag = this.#getUint8();
    // if (tag !== CompoundTag.tag){
    //   throw new Error(`Encountered unsupported tag byte "${tag}"`);
    // }

    const result = this.#getTag(CompoundTag.tag);
    return result;
  }

  /**
   * Reads the tag at the reader's current offset position, based on
   * the supplied tag byte value. It then returns the object for that
   * tag type.
  */
  #getTag(tag: number): Tag {
    if (tag === EndTag.tag) return this.#getEndTag();
    if (tag === ByteTag.tag) return this.#getByteTag();
    if (tag === ShortTag.tag) return this.#getShortTag();
    if (tag === IntTag.tag) return this.#getIntTag();
    if (tag === LongTag.tag) return this.#getLongTag();
    if (tag === FloatTag.tag) return this.#getFloatTag();
    if (tag === DoubleTag.tag) return this.#getDoubleTag();
    if (tag === ByteArrayTag.tag) return this.#getByteArrayTag();
    if (tag === StringTag.tag) return this.#getStringTag();
    if (tag === ListTag.tag) return this.#getListTag();
    if (tag === CompoundTag.tag) return this.#getCompoundTag();
    if (tag === IntArrayTag.tag) return this.#getIntArrayTag();
    if (tag === LongArrayTag.tag) return this.#getLongArrayTag();
    throw new Error(`Encountered unsupported tag byte "${tag}"`);
  }

  #getEndTag() {
    this.#offset += 1;
    return new EndTag();
  }

  #getByteTag() {
    const value = this.#getInt8();
    return new ByteTag(value);
  }

  #getShortTag() {
    const value = this.#getInt16();
    return new ShortTag(value);
  }

  #getIntTag() {
    const value = this.#getInt32();
    return new IntTag(value);
  }

  #getLongTag() {
    const value = this.#getBigInt64();
    return new LongTag(value);
  }

  #getFloatTag() {
    const value = this.#getFloat32();
    return new FloatTag(value);
  }

  #getDoubleTag() {
    const value = this.#getFloat64();
    return new DoubleTag(value);
  }

  #getByteArrayTag() {
    const value = this.#getUint8Array();
    return new ByteArrayTag(value);
  }

  #getStringTag() {
    const value = this.#getString();
    return new StringTag(value);
  }

  #getListTag() {
    const value = this.#getList();
    return new ListTag(value);
  }

  #getCompoundTag() {
    // if ([150,190,198].includes(this.#offset)){
      const byte = this.#getUint8();
    // }
    const name = this.#getString();
    const value = this.#getCompound();
    return new CompoundTag(name,value);
  }

  #getIntArrayTag() {
    const value = this.#getInt32Array();
    return new IntArrayTag(value);
  }

  #getLongArrayTag() {
    const value = this.#getBigInt64Array();
    return new LongArrayTag(value);
  }

  #getUint8() {
    const value = this.#view.getUint8(this.#offset);
    this.#offset += 1;
    return value;
  }

  /**
   * Commonly used to read Byte tags.
  */
  #getInt8() {
    const value = this.#view.getInt8(this.#offset);
    this.#offset += 1;
    return value;
  }

  #getUint16() {
    const value = this.#view.getUint16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  /**
   * Commonly used to read Short tags.
  */
  #getInt16() {
    const value = this.#view.getInt16(this.#offset,this.#littleEndian);
    this.#offset += 2;
    return value;
  }

  #getUint32() {
    const value = this.#view.getUint32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  /**
   * Commonly used to read Int tags.
  */
  #getInt32() {
    const value = this.#view.getInt32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  /**
   * Commonly used to read Float tags.
  */
  #getFloat32() {
    const value = this.#view.getFloat32(this.#offset,this.#littleEndian);
    this.#offset += 4;
    return value;
  }

  /**
   * Commonly used to read Double tags.
  */
  #getFloat64() {
    const value = this.#view.getFloat64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  /**
   * Commonly used to read Long tags.
  */
  #getBigInt64() {
    const value = this.#view.getBigInt64(this.#offset,this.#littleEndian);
    this.#offset += 8;
    return value;
  }

  /**
   * Commonly used to read ByteArray tags.
  */
  #getUint8Array() {
    const length = this.#getUint32();
    const value = this.#data.slice(this.#offset,this.#offset + length);
    this.#offset += length;
    return value;
  }

  /**
   * Commonly used to read IntArray tags.
  */
  #getInt32Array() {
    const length = this.#getUint32();
    const value = new Int32Array(length);
    for (let i = 0; i < length; i++){
      const entry = this.#getInt32();
      value[i] = entry;
    }
    return value;
  }

  /**
   * Commonly used to read LongArray tags.
  */
  #getBigInt64Array() {
    const length = this.#getUint32();
    const value = new BigInt64Array(length);
    for (let i = 0; i < length; i++){
      const entry = this.#getBigInt64();
      value[i] = entry;
    }
    return value;
  }

  /**
   * Commonly used to read String tags.
  */
  #getString() {
    const length = this.#getUint16();
    const value = this.#data.slice(this.#offset,this.#offset + length);
    this.#offset += length;
    return new TextDecoder().decode(value);
  }

  /**
   * Exclusively used to read List tags.
  */
  #getList() {
    const tag = this.#getUint8();
    const length = this.#getUint32();
    const value: Tag[] = [];
    for (let i = 0; i < length; i++){
      const entry = this.#getTag(tag);
      value.push(entry);
    }
    return value;
  }

  /**
   * Exclusively used to read Compound tags.
  */
  #getCompound() {
    const value: { [name: string]: Tag } = {};
    while (true){
      const tag = this.#getUint8();
      if (tag === EndTag.tag){
        this.#getTag(tag);
        break;
      }
      const name = this.#getString();
      const entry = this.#getTag(tag);
      value[name] = entry;
    }
    return value;
  }
}