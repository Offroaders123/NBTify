import parse from "./src/parse.js";
import write from "./src/write.js";

export { parse, write };

export default { parse, write, [Symbol.toStringTag]: "NBT" };