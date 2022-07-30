type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array;

export function read(data: ArrayBuffer | TypedArray,{ endian }?: { endian?: "big" | "little" }): Promise<object>;
export function write(data: object,{ endian, encoding }?: { endian?: "big" | "little", encoding?: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;

export function compress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;
export function decompress(data: ArrayBuffer | TypedArray,{ encoding }: { encoding: "gzip" | "deflate" | "deflate-raw" }): Promise<ArrayBuffer | TypedArray>;

export class Reader {
  constructor(data: Uint8Array,endian: "big" | "little");

  offset: number;
  endian: boolean;
  data: Uint8Array;
  view: DataView;

  byte(): number;
  short(): number;
  int(): number;
  float(): number;
  double(): number;
  long(): bigint;
  byteArray(): number[];
  intArray(): number[];
  longArray(): bigint[];
  string(): string;
  list(): object;
  compound(): object;
}

export class Writer {
  constructor(endian: "big" | "little");

  offset: number;
  endian: boolean;
  buffer: ArrayBuffer;
  view: DataView;
  data: Uint8Array;

  accommodate(size: number): void;
  getData(): ArrayBuffer | TypedArray;
  byte(value: number): void;
  short(value: number): void;
  int(value: number): void;
  float(value: number): void;
  double(value: number): void;
  long(value: bigint): void;
  byteArray(value: number[]): void;
  intArray(value: number[]): void;
  longArray(value: bigint[]): void;
  string(value: string): void;
  list(value: object): void;
  compound(value: object): void;
}

export const tags: {
  end: number;
  byte: number;
  short: number;
  int: number;
  long: number;
  float: number;
  double: number;
  byteArray: number;
  string: number;
  list: number;
  compound: number;
  intArray: number;
  longArray: number;
};

export const types: {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
};