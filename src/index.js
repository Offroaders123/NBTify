import { read, Reader } from "./read.js";
import { write, Writer } from "./write.js";

import { compress, decompress } from "./compression.js";

export { read, Reader, write, Writer, compress, decompress };

export default { read, Reader, write, Writer, compress, decompress, [Symbol.toStringTag]: "NBT" };