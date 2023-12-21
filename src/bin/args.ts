import type { NBTDataOptions } from "../index.js";

const SNBT_PATTERN = /^--snbt$/;
const PIPE_PATTERN = /^--pipe$/;
const ROOT_NAME_PATTERN = /^--root-name=/;
const ENDIAN_PATTERN = /^--endian=/;
const COMPRESSION_PATTERN = /^--compression=/;
const BEDROCK_LEVEL_PATTERN = /^--bedrock-level=/;

const args: string[] = process.argv.slice(2);

process.on("uncaughtException",error => {
  console.error(`${error}`);
  process.exit(1);
});

export const file: string = args.shift() ?? (() => {
  throw new TypeError("Missing argument 'input'");
})();

for (const arg of args){
  switch (true){
    case SNBT_PATTERN.test(arg):
    case PIPE_PATTERN.test(arg):
    case ROOT_NAME_PATTERN.test(arg):
    case ENDIAN_PATTERN.test(arg):
    case COMPRESSION_PATTERN.test(arg):
    case BEDROCK_LEVEL_PATTERN.test(arg): break;
    default: throw new TypeError(`Unexpected argument '${arg}'`);
  }
}

export const snbt: boolean = args.some(arg => SNBT_PATTERN.test(arg));
export const pipe: boolean = args.some(arg => PIPE_PATTERN.test(arg));
export const rootName: NBTDataOptions["rootName"] = args.find(arg => ROOT_NAME_PATTERN.test(arg))?.replace(ROOT_NAME_PATTERN,"");
export const endian: NBTDataOptions["endian"] = args.find(arg => ENDIAN_PATTERN.test(arg))?.replace(ENDIAN_PATTERN,"") as NBTDataOptions["endian"];
export const compression: NBTDataOptions["compression"] = args.find(arg => COMPRESSION_PATTERN.test(arg))?.replace(COMPRESSION_PATTERN,"") as NBTDataOptions["compression"];
export const bedrockLevel: NBTDataOptions["bedrockLevel"] = args.find(arg => BEDROCK_LEVEL_PATTERN.test(arg))?.replace(BEDROCK_LEVEL_PATTERN,"") as NBTDataOptions["bedrockLevel"];