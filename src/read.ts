import { Tag, TagByte, EndTag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "./tags.js";
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
   * Top-level function to initiate the NBT reader on a provided `Uint8Array`.
  */
  read(data: Uint8Array, { endian = "big" }: { endian?: "big" | "little"; } = {}) {
    if (!(data instanceof Uint8Array)){
      throw new TypeError("First argument must be a Uint8Array");
    }
    if (endian !== "big" && endian !== "little"){
      throw new TypeError(`Endian option must be set to either "big" or "little"`);
    }

    this.#offset = 0;
    this.#littleEndian = (endian === "little");
    this.#data = data;
    this.#view = new DataView(this.#data.buffer);

    const tag = this.#getTagByte();
    if (tag !== CompoundTag.TAG_BYTE){
      throw new Error(`Encountered unsupported tag byte ${tag} in NBT byte stream`);
    }

    const name = this.#getString();
    const value = this.#getCompoundTag(name);

    return value;
  }

  /**
   * Reads the tag byte value at the reader's current offset position.
   * It then returns the byte value from that position.
  */
  #getTagByte() {
    const value = this.#getUint8() as TagByte;
    return value;
  }

  /**
   * Reads the tag at the reader's current offset position, based on
   * the supplied tag byte value. It then returns the constructed class
   * for that tag type.
   * 
   * If a non-supported tag byte is encountered, the function will
   * throw.
  */
  #getTag(tag: TagByte): Tag {
    switch (tag){
      case ByteTag.TAG_BYTE: return this.#getByteTag();
      case ShortTag.TAG_BYTE: return this.#getShortTag();
      case IntTag.TAG_BYTE: return this.#getIntTag();
      case LongTag.TAG_BYTE: return this.#getLongTag();
      case FloatTag.TAG_BYTE: return this.#getFloatTag();
      case DoubleTag.TAG_BYTE: return this.#getDoubleTag();
      case ByteArrayTag.TAG_BYTE: return this.#getByteArrayTag();
      case StringTag.TAG_BYTE: return this.#getStringTag();
      case ListTag.TAG_BYTE: return this.#getListTag();
      case CompoundTag.TAG_BYTE: return this.#getCompoundTag();
      case IntArrayTag.TAG_BYTE: return this.#getIntArrayTag();
      case LongArrayTag.TAG_BYTE: return this.#getLongArrayTag();
      default: throw new Error(`Encountered unsupported tag byte ${tag} in NBT byte stream`);
    }
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
    return new ListTag(...value);
  }

  /**
   * Optionally excepts a name string for the resulting
   * Compound tag.
  */
  #getCompoundTag(name?: string) {
    const value = this.#getCompound();
    const content = name !== undefined ? { [CompoundTag.ROOT_NAME]: name, ...value } : value;
    return new CompoundTag(content);
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
    const tag = this.#getTagByte();
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
      const tag = this.#getTagByte();
      if (tag === EndTag.TAG_BYTE) break;
      const name = this.#getString();
      const entry = this.#getTag(tag);
      value[name] = entry;
    }
    return value;
  }
}