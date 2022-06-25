import parse from "./parse.js";
import write from "./write.js";

export { parse, write };

export default { parse, write, [Symbol.toStringTag]: "NBT" };