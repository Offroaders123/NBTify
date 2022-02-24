/* View as actual ones and zeros (ASCII), found on StackOverflow - https://stackoverflow.com/a/62224531 */
const toBinString = bytes => {
  let result = bytes.reduce((str,byte) => {
    let originalBin = byte.toString(2).padStart(8,"0");
    let charVersion = String.fromCharCode(byte);
    let charCode = charVersion.charCodeAt(0);
    let charValid = charCode >= 32 && charCode < 127;//console.log(byte,charVersion,charValid);
    let result2 = `${str}${(str != "") ? " " : ""}${(charValid) ? charVersion : byte}`;
    //if (!charValid) console.log(byte,originalBin,toFlipEndian(byte),parseInt(toFlipEndian(byte),2));
    return result2;
  },"");
  return result;
}

/* Reverse integer bytes (flip endianness) */
const toFlipEndian = int => {
  let flipped = (int).toString(2).split("").reverse().join("");
  return flipped.padEnd(8,"0");
}

/* Check for Bedrock Level dat header, from prismarine-nbt */
const hasBedrockLevelHeader = (data) => {
  let result = data[1] === 0 && data[2] === 0 && data[3] === 0;//console.log(result);
  return result;
}

/* convert key byte definitions to little endian, this was for the nbt.js file update. */
let arr = [];
for (let i = 0; i < 13; i++){
  let thing = parseInt(toFlipEndian(i),2);
  console.log(i,i.toString(2).padStart(8,"0"),thing.toString(2).padStart(8,"0"),thing);
  arr.push(thing);
}
console.log(arr.toString().replace(/,/g," "));


/*
let response = await fetch("hello_world.nbt");
let buffer = await response.arrayBuffer();
let data = new Uint8Array(buffer);console.log(toBinString(data));
*/

let response = await fetch("level.dat");
let buffer = await response.arrayBuffer();
let data = new Uint8Array(buffer.slice(8,buffer.byteLength));//console.log(toBinString(data));

/* Partially from prismarine-nbt also */
data.startOffset = data.startOffset || 0;
if (hasBedrockLevelHeader(data)){ /* Bedrock level.dat header */
  data.startOffset += 8; // Skip + 8 bytes becase of the non-NBT header bytes at the beginning of the file
}

nbt.parse(data,(error,data) => {
  if (error) throw error;
  console.log(data);
});