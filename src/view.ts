import { Byte, Short, Int, Float } from "./primitive.js";
import { Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag, TAG_TYPE, TAG_END, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG, TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING, TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY, getTagType } from "./tag.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class NBTView extends DataView {
  #data = new Uint8Array(this.buffer);

  getTag(tag: TAG_TYPE, byteOffset: number, littleEndian = false): Tag {
    switch (tag){
      case TAG_BYTE: return this.getByte(byteOffset);
      case TAG_SHORT: return this.getShort(byteOffset,littleEndian);
      case TAG_INT: return this.getInt(byteOffset,littleEndian);
      case TAG_LONG: return this.getLong(byteOffset,littleEndian);
      case TAG_FLOAT: return this.getFloat(byteOffset,littleEndian);
      case TAG_DOUBLE: return this.getDouble(byteOffset,littleEndian);
      case TAG_BYTE_ARRAY: return this.getByteArray(byteOffset);
      case TAG_STRING: return this.getString(byteOffset);
      case TAG_LIST: return this.getList(byteOffset,littleEndian);
      case TAG_COMPOUND: return this.getCompound(byteOffset,littleEndian);
      case TAG_INT_ARRAY: return this.getIntArray(byteOffset);
      case TAG_LONG_ARRAY: return this.getLongArray(byteOffset);
      default: throw new TypeError(`Encountered unsupported tag ${tag}`);
    }
  }

  getTagType(byteOffset: number) {
    return this.getUint8(byteOffset) as TAG_TYPE;
  }

  getByte(byteOffset: number): ByteTag {
    return new Byte(this.getInt8(byteOffset));
  }

  getShort(byteOffset: number, littleEndian = false): ShortTag {
    return new Short(this.getInt16(byteOffset,littleEndian));
  }

  getInt(byteOffset: number, littleEndian = false): IntTag {
    return new Int(this.getInt32(byteOffset,littleEndian));
  }

  getLong(byteOffset: number, littleEndian = false): LongTag {
    return this.getBigInt64(byteOffset,littleEndian);
  }

  getFloat(byteOffset: number, littleEndian = false): FloatTag {
    return new Float(this.getFloat32(byteOffset,littleEndian));
  }

  getDouble(byteOffset: number, littleEndian = false): DoubleTag {
    return this.getFloat64(byteOffset,littleEndian);
  }

  getByteArray(byteOffset: number, littleEndian = false): ByteArrayTag {
    const byteLength = this.getUint32(byteOffset += 4,littleEndian);
    const value = this.buffer.slice(byteOffset,byteOffset + byteLength);
    return new Int8Array(value);
  }

  getString(byteOffset: number, littleEndian = false): StringTag {
    const length = this.getUint16(byteOffset += 2,littleEndian);
    const value = this.buffer.slice(byteOffset,byteOffset + length);
    return decoder.decode(value);
  }

  getList(byteOffset: number, littleEndian = false): ListTag {
    const tag = this.getTagType(byteOffset += 1);
    const length = this.getUint32(byteOffset += 4,littleEndian);
    const value: ListTag = [];
    for (let i = 0; i < length; i++){
      const entry = this.getTag(tag,byteOffset,littleEndian);
      // BYTEOFFSET NEEDS FIX HERE, update after calling getTag()
      value.push(entry);
    }
    return value;
  }

  getCompound(byteOffset: number, littleEndian = false): CompoundTag {
    const value: CompoundTag = {};
    while (true){
      const tag = this.getTagType(byteOffset += 1);
      if (tag === TAG_END) break;
      const name = this.getString(byteOffset,littleEndian);
      // BYTEOFFSET UPDATE to raw string byte length
      const entry = this.getTag(tag,byteOffset,littleEndian);
      // BYTEOFFSET UPDATE, recursive byte length of getTag()
      value[name] = entry;
    }
    return value;
  }

  getIntArray(byteOffset: number, littleEndian = false): IntArrayTag {
    const byteLength = this.getUint32(byteOffset += 4,littleEndian);
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.getInt32(byteOffset += 4,littleEndian);
      value[i] = entry;
    }
    return value;
  }

  getLongArray(byteOffset: number, littleEndian = false): LongArrayTag {
    const byteLength = this.getUint32(byteOffset += 4,littleEndian);
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.getBigInt64(byteOffset += 8,littleEndian);
      value[i] = entry;
    }
    return value;
  }

  setTag(byteOffset: number, value: Tag, littleEndian = false) {
    const type = getTagType(value);
    switch (type){
      case TAG_BYTE: return this.setByte(byteOffset,value as ByteTag);
      case TAG_SHORT: return this.setShort(byteOffset,value as ShortTag,littleEndian);
      case TAG_INT: return this.setInt(byteOffset,value as IntTag,littleEndian);
      case TAG_LONG: return this.setLong(byteOffset,value as LongTag,littleEndian);
      case TAG_FLOAT: return this.setFloat(byteOffset,value as FloatTag,littleEndian);
      case TAG_DOUBLE: return this.setDouble(byteOffset,value as DoubleTag,littleEndian);
      case TAG_BYTE_ARRAY: return this.setByteArray(byteOffset,value as ByteArrayTag,littleEndian);
      case TAG_STRING: return this.setString(byteOffset,value as StringTag,littleEndian);
      case TAG_LIST: return this.setList(byteOffset,value as ListTag,littleEndian);
      case TAG_COMPOUND: return this.setCompound(byteOffset,value as CompoundTag,littleEndian);
      case TAG_INT_ARRAY: return this.setIntArray(byteOffset,value as IntArrayTag,littleEndian);
      case TAG_LONG_ARRAY: return this.setLongArray(byteOffset,value as LongArrayTag,littleEndian);
    }
  }

  setTagType(byteOffset: number, value: TAG_TYPE) {
    this.setUint8(byteOffset,value);
  }

  setByte(byteOffset: number, value: ByteTag) {
    this.setInt8(byteOffset,value.valueOf());
  }

  setShort(byteOffset: number, value: ShortTag, littleEndian = false) {
    this.setInt16(byteOffset,value.valueOf(),littleEndian);
  }

  setInt(byteOffset: number, value: IntTag, littleEndian = false) {
    this.setInt32(byteOffset,value.valueOf(),littleEndian);
  }

  setLong(byteOffset: number, value: LongTag, littleEndian = false) {
    this.setBigInt64(byteOffset,value,littleEndian);
  }

  setFloat(byteOffset: number, value: FloatTag, littleEndian = false) {
    this.setFloat32(byteOffset,value.valueOf(),littleEndian);
  }

  setDouble(byteOffset: number, value: DoubleTag, littleEndian = false) {
    this.setFloat64(byteOffset,value,littleEndian);
  }

  setByteArray(byteOffset: number, value: ByteArrayTag, littleEndian = false) {
    const { byteLength } = value;
    this.setUint32(byteOffset += 4,byteLength,littleEndian);
    this.#data.set(value,byteOffset);
  }

  setString(byteOffset: number, value: StringTag, littleEndian = false) {
    const entry = encoder.encode(value);
    const { length } = entry;
    this.setUint16(byteOffset += 2,length,littleEndian);
    this.#data.set(entry,byteOffset);
  }

  setList(byteOffset: number, value: ListTag, littleEndian = false) {
    const tag = getTagType(value[0]);
    const { length } = value;
    this.setTagType(byteOffset += 1,tag);
    this.setUint32(byteOffset += 4,length,littleEndian);
    for (const entry of value){
      this.setTag(byteOffset,entry,littleEndian);
      // BYTEOFFSET update 'ere
    }
  }

  setCompound(byteOffset: number, value: CompoundTag, littleEndian = false) {
    for (const [name,entry] of Object.entries(value)){
      const tag = getTagType(entry);
      this.setTagType(byteOffset += 1,tag);
      this.setString(byteOffset,name,littleEndian);
      // BYTEOFFSET update
      this.setTag(byteOffset,entry,littleEndian);
      // BYTEOFFSET update
    }
    this.setTagType(byteOffset,TAG_END);
  }

  setIntArray(byteOffset: number, value: IntArrayTag, littleEndian = false) {
    const { byteLength } = value;
    this.setUint32(byteOffset += 4,byteLength,littleEndian);
    for (const entry of value){
      this.setInt32(byteOffset += 4,entry,littleEndian);
    }
  }

  setLongArray(byteOffset: number, value: LongArrayTag, littleEndian = false) {
    const { byteLength } = value;
    this.setUint32(byteOffset += 4,byteLength,littleEndian);
    for (const entry of value){
      this.setBigInt64(byteOffset += 8,entry,littleEndian);
    }
  }
}