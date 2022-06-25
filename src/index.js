import read from "./read.js";
import write from "./write.js";

export { read, write };

export default { read, write, [Symbol.toStringTag]: "NBT" };