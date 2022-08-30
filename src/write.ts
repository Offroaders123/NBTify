import { Tag, TagByte, EndTag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tags.js";
import { compress } from "./compression.js";

/**
 * The bare-bones implementation to write data to an NBT byte stream.
*/
export class Writer {
  #offset = 0;
  #littleEndian = false;
  #buffer = new ArrayBuffer(1024);
  #view = new DataView(this.#buffer);
  #data = new Uint8Array(this.#buffer);

  /**
   * Top-level function to initiate the NBT writer on a provided `CompoundTag`.
   * 
   * Defaults to writing the byte stream as big endian.
  */
  write(data: CompoundTag, { endian = "big" }: { endian?: "big" | "little"; } = {}) {
    if (!(data instanceof CompoundTag)){
      throw new TypeError(`First argument must be a CompoundTag, received type ${typeof data}`);
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError(`Endian option must be set to either "big" or "little"`);
    }

    this.#offset = 0;
    this.#littleEndian = (endian === "little");

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
  */
  #accommodate(size: number) {
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
  */
  #setTagByte(value: TagByte) {
    this.#setUint8(value);
  }

  /**
   * Writes the tag at the reader's current offset position.
  */
  #setTag(tag: Tag) {
    switch (true){
      case tag instanceof ByteTag: return this.#setByteTag(tag as ByteTag);
      case tag instanceof ShortTag: return this.#setShortTag(tag as ShortTag);
      case tag instanceof IntTag: return this.#setIntTag(tag as IntTag);
      case tag instanceof LongTag: return this.#setLongTag(tag as LongTag);
      case tag instanceof FloatTag: return this.#setFloatTag(tag as FloatTag);
      case tag instanceof DoubleTag: return this.#setDoubleTag(tag as DoubleTag);
      case tag instanceof ByteArrayTag: return this.#setByteArrayTag(tag as ByteArrayTag);
      case tag instanceof StringTag: return this.#setStringTag(tag as StringTag);
      case tag instanceof ListTag: return this.#setListTag(tag as ListTag);
      case tag instanceof CompoundTag: return this.#setCompoundTag(tag as CompoundTag);
      case tag instanceof IntArrayTag: return this.#setIntArrayTag(tag as IntArrayTag);
      case tag instanceof LongArrayTag: return this.#setLongArrayTag(tag as LongArrayTag);
    }
  }

  #setByteTag(tag: ByteTag) {
    const value = tag.valueOf();
    this.#setInt8(value);
  }
  
  #setShortTag(tag: ShortTag) {
    const value = tag.valueOf();
    this.#setInt16(value);
  }
  
  #setIntTag(tag: IntTag) {
    const value = tag.valueOf();
    this.#setInt32(value);
  }

  #setLongTag(tag: LongTag) {
    const value = tag.valueOf();
    this.#setBigInt64(value);
  }
  
  #setFloatTag(tag: FloatTag) {
    const value = tag.valueOf();
    this.#setFloat32(value);
  }

  #setDoubleTag(tag: DoubleTag) {
    const value = tag.valueOf();
    this.#setFloat64(value);
  }

  #setByteArrayTag(tag: ByteArrayTag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setUint8Array(value);
  }

  #setStringTag(tag: StringTag) {
    const value = tag.valueOf();
    this.#setString(value);
  }

  #setListTag(tag: ListTag) {
    const value = tag.valueOf();
    this.#setList(value);
  }

  #setCompoundTag(tag: CompoundTag) {
    const value = tag.valueOf();
    this.#setCompound(value);
  }

  #setIntArrayTag(tag: IntArrayTag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setInt32Array(value);
  }

  #setLongArrayTag(tag: LongArrayTag) {
    const { byteLength } = tag;
    const value = tag.valueOf();
    this.#setUint32(byteLength);
    this.#setBigInt64Array(value);
  }

  #setUint8(value: number) {
    this.#accommodate(1);
    this.#view.setUint8(this.#offset,value);
    this.#offset += 1;
  }

  /**
   * Commonly used to write Byte tags.
  */
  #setInt8(value: number) {
    this.#accommodate(1);
    this.#view.setInt8(this.#offset,value);
    this.#offset += 1;
  }

  #setUint16(value: number) {
    this.#accommodate(2);
    this.#view.setUint16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  /**
   * Commonly used to write Short tags.
  */
  #setInt16(value: number) {
    this.#accommodate(2);
    this.#view.setInt16(this.#offset,value,this.#littleEndian);
    this.#offset += 2;
  }

  #setUint32(value: number) {
    this.#accommodate(4);
    this.#view.setUint32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Int tags.
  */
  #setInt32(value: number) {
    this.#accommodate(4);
    this.#view.setInt32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Float tags.
  */
  #setFloat32(value: number) {
    this.#accommodate(4);
    this.#view.setFloat32(this.#offset,value,this.#littleEndian);
    this.#offset += 4;
  }

  /**
   * Commonly used to write Double tags.
  */
  #setFloat64(value: number) {
    this.#accommodate(8);
    this.#view.setFloat64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  /**
   * Commonly used to read Long tags.
  */
  #setBigInt64(value: bigint) {
    this.#accommodate(8);
    this.#view.setBigInt64(this.#offset,value,this.#littleEndian);
    this.#offset += 8;
  }

  /**
   * Commonly used to write ByteArray tags.
  */
  #setUint8Array(value: Uint8Array) {
    const { byteLength } = value;
    this.#accommodate(byteLength);
    this.#data.set(value,this.#offset);
    this.#offset += byteLength;
  }

  /**
   * Commonly used to write IntArray tags.
  */
  #setInt32Array(value: Int32Array) {
    for (const entry of value){
      this.#setInt32(entry);
    }
  }

  /**
   * Commonly used to write LongArray tags.
  */
  #setBigInt64Array(value: BigInt64Array) {
    for (const entry of value){
      this.#setBigInt64(entry);
    }
  }

  /**
   * Commonly used to write String tags.
  */
  #setString(value: string) {
    const entry = new TextEncoder().encode(value);
    const { length } = entry;
    this.#setUint16(length);
    this.#accommodate(length);
    this.#data.set(entry,this.#offset);
    this.#offset += length;
  }

  /**
   * Exclusively used to write List tags.
  */
  #setList(value: Tag[]) {
    const tag = value[0].constructor.TAG_BYTE;
    const { length } = value;
    this.#setTagByte(tag);
    this.#setUint32(length);
    for (const entry of value){
      this.#setTag(entry);
    }
  }

  /**
   * Exclusively used to write Compound tags.
  */
  #setCompound(value: { [name: string]: Tag }) {
    for (const [name,entry] of Object.entries(value)){
      const tag = entry.constructor.TAG_BYTE;
      this.#setTagByte(tag);
      this.#setString(name);
      this.#setTag(entry);
    }
    this.#setTagByte(EndTag.TAG_BYTE);
  }
}