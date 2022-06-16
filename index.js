import parse from "./src/parse.js";
import write from "./src/write.js";
import simplify from "./src/simplify.js";
import expand from "./src/expand.js";

export { parse, write, simplify, expand };

export default { parse, write, simplify, expand, [Symbol.toStringTag]: "NBT" };