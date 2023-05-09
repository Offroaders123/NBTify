import { inspect, InspectOptionsStylized } from "node:util";

export type CustomInspectFunction = (depth: number, options: InspectOptionsStylized, inspectFunction: typeof inspect) => any;

declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }

  type CompressionFormat = "gzip" | "deflate" | "deflate-raw";

  interface CompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var CompressionStream: {
    new (format: CompressionFormat): CompressionStream;
    prototype: CompressionStream;
  };

  interface DecompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<BufferSource>;
  }

  var DecompressionStream: {
    new (format: CompressionFormat): DecompressionStream;
    prototype: DecompressionStream;
  };
}

export {};