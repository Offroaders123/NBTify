import type { NBTData } from "./format.js";

export interface NBTErrorOptions extends ErrorOptions {
  byteOffset: number;
  cause: NBTData;
  remaining: number;
}

export class NBTError extends Error {
  byteOffset: number;
  override cause: NBTData;
  remaining: number;

  constructor(message: string, options: NBTErrorOptions) {
    super(message,options);
    this.byteOffset = options.byteOffset;
    this.cause = options.cause;
    this.remaining = options.remaining;
  }
}