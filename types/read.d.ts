type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array;

export function read(data: ArrayBuffer | TypedArray, { endian }?: { endian?: "big" | "little"; }): {};

export class Reader {
  constructor(data: Uint8Array, endian: "big" | "little");
  offset: number;
  endian: boolean;
  data: Uint8Array;
  view: DataView;
  byte(): number;
  short(): number;
  int(): number;
  float(): number;
  double(): number;
  long(): any;
  byteArray(): number[];
  intArray(): number[];
  longArray(): any[];
  string(): string;
  list(): {
    type: any;
    value: any[];
  };
  compound(): {};
}