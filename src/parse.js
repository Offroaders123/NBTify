import Reader from "./Reader.js";
import { tags } from "./tags.js";
import { decompress } from "./compression.js";

export default async function parse(data,{ endian } = {}){
  if (!data) throw new Error("Unexpected falsy value for the data parameter");

  if (typeof endian !== "undefined" && !["big","little"].includes(endian)){
    throw new Error("Unexpected endian type");
  }

  if (endian !== "big" && hasBedrockLevelHeader(data)){
    data = data.slice(8);
    endian = "little";
  }

  if (typeof endian !== "undefined"){
    try {
      const result = await runParser(data,endian);
      return result;
    } catch (error){
      throw error;
    }
  } else {
    let result = null;
    try {
      result = await runParser(data,"big");
    } catch (error){
      try {
        result = await runParser(data,"little");
      } catch {
        throw error;
      }
    }
    return result;
  }
}

async function runParser(data,endian){
  if (hasGzipHeader(data)) data = await decompress(data,{ encoding: "gzip" });

  const reader = new Reader(data,endian);
  const compound = reader.byte();
  if (compound !== tags.compound) throw new Error("Top tag must be a compound");

  return { name: reader.string(), type: "compound", value: reader.compound() };
}

function hasBedrockLevelHeader(data){
  const header = new Uint8Array(data.slice(0,4));
  const result = (header[1] === 0 && header[2] === 0 && header[3] === 0);
  return result;
}

function hasGzipHeader(data){
  const header = new Uint8Array(data.slice(0,2));
  const result = (header[0] === 0x1f && header[1] === 0x8b);
  return result;
}