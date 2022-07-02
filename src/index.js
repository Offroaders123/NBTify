import { read, Reader } from "./read.js";
import { write, Writer } from "./write.js";

import { compress, decompress } from "./compression.js";

import { tags, types } from "./tags.js";

export { read, write, compress, decompress, Reader, Writer, tags, types };

export default { read, write, compress, decompress, Reader, Writer, tags, types, [Symbol.toStringTag]: "NBT" };