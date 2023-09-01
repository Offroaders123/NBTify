// tsx --watch ./escapes.ts
import * as NBT from "../dist/index.js";

const json = `{
  "Characters": [
    "\\"This shouldn't error",
    '\\'Nether should this',
    '"',
    "'",
    "\\b",
    '\\b',
    "\\f",
    '\\f',
    "\\nHow about a new line?",
    '\\nOr a single-quoted new line?',
    "\\r",
    '\\r',
    "\\t",
    '\\t'
  ]
}`;
console.log(json);

const obj = NBT.parse(json);
console.log(obj);

const result = NBT.stringify(obj,{ space: 2 });
console.log(result);