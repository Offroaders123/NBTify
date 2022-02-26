export default function encodeUTF8(string){
  const array = [];
  for (let char of string){
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