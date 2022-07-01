import { read, Reader } from "./read.js";
import { write, Writer } from "./write.js";
import { compress, decompress } from "./compression.js";

declare const NBT: {
  read: typeof read;
  Reader: typeof Reader;
  write: typeof write;
  Writer: typeof Writer;
  compress: typeof compress;
  decompress: typeof decompress;
};

export { read, Reader, write, Writer, compress, decompress };

export default NBT;