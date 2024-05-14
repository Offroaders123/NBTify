import type { NBTDataOptions, StringifyOptions } from "../index.js";

const NBT_PATTERN = /^--nbt$/;
const SNBT_PATTERN = /^--snbt$/;
const JSON_PATTERN = /^--json$/;
const ROOT_NAME_PATTERN = /^--root-name=/;
const ENDIAN_PATTERN = /^--endian=/;
const COMPRESSION_PATTERN = /^--compression=/;
const BEDROCK_LEVEL_PATTERN = /^(?:--bedrock-level$|--bedrock-level=)/;
const SPACE_PATTERN = /^--space=/;

const args: string[] = process.argv.slice(2);

process.on("uncaughtException", error => {
  console.error(`${error}`);
  process.exit(1);
});

export const file: string | typeof process.stdin.fd = !process.stdin.isTTY
  ? process.stdin.fd
  : args.shift() ?? (() => {
    throw new TypeError("Missing argument 'input'");
  })();

for (const arg of args) {
  switch (true) {
    case NBT_PATTERN.test(arg):
    case SNBT_PATTERN.test(arg):
    case JSON_PATTERN.test(arg):
    case ROOT_NAME_PATTERN.test(arg):
    case ENDIAN_PATTERN.test(arg):
    case COMPRESSION_PATTERN.test(arg):
    case BEDROCK_LEVEL_PATTERN.test(arg):
    case SPACE_PATTERN.test(arg):
      break;
    default:
      throw new TypeError(`Unexpected argument '${arg}'`);
  }
}

export const nbt: boolean = args
  .some(arg => NBT_PATTERN.test(arg));

export const snbt: boolean = args
  .some(arg => SNBT_PATTERN.test(arg));

export const json: boolean = args
  .some(arg => JSON_PATTERN.test(arg));

type NonPartial<T> = { [K in keyof Required<T>]: T[K] };

type NonPartialFormat = NonPartial<NBTDataOptions>;

const rootName: NonPartialFormat["rootName"] = args
  .find(arg => ROOT_NAME_PATTERN.test(arg))
  ?.replace(ROOT_NAME_PATTERN, "");

const endian: NonPartialFormat["endian"] = args
  .find(arg => ENDIAN_PATTERN.test(arg))
  ?.replace(ENDIAN_PATTERN, "") as NonPartialFormat["endian"];

const compression: NonPartialFormat["compression"] = (() => {
  const value: string | undefined = args
    .find(arg => COMPRESSION_PATTERN.test(arg))
    ?.replace(COMPRESSION_PATTERN, "");
  return value === "null" ? null : value as NonPartialFormat["compression"];
})();

const bedrockLevel: NonPartialFormat["bedrockLevel"] = (() => {
  const value: string | undefined = args
    .find(arg => BEDROCK_LEVEL_PATTERN.test(arg))
    ?.replace(BEDROCK_LEVEL_PATTERN, "");
  switch (value) {
    case undefined: return value;
    case "true":
    case "": return true;
    case "false": return false;
    default: throw new TypeError("Bedrock Level must be a boolean");
  }
})();

export const format: NonPartialFormat = { rootName, endian, compression, bedrockLevel };

export const space: StringifyOptions["space"] = (() => {
  const space: string | undefined = args
    .find(arg => SPACE_PATTERN.test(arg))
    ?.replace(SPACE_PATTERN, "");
  if (Number.isNaN(Number(space))) {
    return space;
  } else {
    return Number(space);
  }
})();