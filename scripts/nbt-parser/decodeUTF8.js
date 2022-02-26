export default function decodeUTF8(array){
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