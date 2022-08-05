declare module "nbt-parser" {
  export { read, Reader } from "read";
  export { write, Writer } from "write";

  export { compress, decompress } from "compression";

  export { tags, types } from "tags";
}