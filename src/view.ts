import { Byte, Short, Int, Float } from "./primitive.js";
import { TAG_TYPE } from "./tag.js";

const decoder = new TextDecoder();

export class NBTView extends DataView {
  getTagType(byteOffset: number) {
    return this.getUint8(byteOffset) as TAG_TYPE;
  }

  getByte(byteOffset: number) {
    return new Byte(this.getInt8(byteOffset));
  }

  getShort(byteOffset: number, littleEndian = false) {
    return new Short(this.getInt16(byteOffset,littleEndian));
  }

  getInt(byteOffset: number, littleEndian = false) {
    return new Int(this.getInt32(byteOffset,littleEndian));
  }

  getLong(byteOffset: number, littleEndian = false) {
    return this.getBigInt64(byteOffset,littleEndian);
  }

  getFloat(byteOffset: number, littleEndian = false) {
    return new Float(this.getFloat32(byteOffset,littleEndian));
  }

  getDouble(byteOffset: number, littleEndian = false) {
    return this.getFloat64(byteOffset,littleEndian);
  }

  getByteArray(byteOffset: number) {
    const byteLength = this.getUint32(byteOffset += 4);
    const value = this.buffer.slice(byteOffset,byteOffset + byteLength);
    return new Int8Array(value);
  }

  getString(byteOffset: number) {
    const length = this.getUint16(byteOffset += 2);
    const value = this.buffer.slice(byteOffset,byteOffset + length);
    return decoder.decode(value);
  }

  getIntArray(byteOffset: number) {
    const byteLength = this.getUint32(byteOffset += 4);
    const value = new Int32Array(byteLength);
    for (const i in value){
      const entry = this.getInt32(byteOffset += 4);
      value[i] = entry;
    }
    return value;
  }

  getLongArray(byteOffset: number) {
    const byteLength = this.getUint32(byteOffset += 4);
    const value = new BigInt64Array(byteLength);
    for (const i in value){
      const entry = this.getBigInt64(byteOffset += 8);
      value[i] = entry;
    }
    return value;
  }

  setTagType(byteOffset: number, value: TAG_TYPE) {
    this.setUint8(byteOffset,value);
  }

  setByte(byteOffset: number, value: number) {
    this.setInt8(byteOffset,value);
  }

  setShort(byteOffset: number, value: number, littleEndian = false) {
    this.setInt16(byteOffset,value,littleEndian);
  }

  setInt(byteOffset: number, value: number, littleEndian = false) {
    this.setInt32(byteOffset,value,littleEndian);
  }

  setLong(byteOffset: number, value: bigint, littleEndian = false) {
    this.setBigInt64(byteOffset,value,littleEndian);
  }

  setFloat(byteOffset: number, value: number, littleEndian = false) {
    this.setFloat32(byteOffset,value,littleEndian);
  }

  setDouble(byteOffset: number, value: number, littleEndian = false) {
    this.setFloat64(byteOffset,value,littleEndian);
  }

  setByteArray(byteOffset: number, value: Int8Array, littleEndian = false) {
    const { byteLength } = value;
    this.setUint32(byteOffset += 4,byteLength,littleEndian);
  }
}