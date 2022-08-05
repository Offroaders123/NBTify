import TypedArray from "./TypedArray";

export function read(data: ArrayBuffer | TypedArray,{ endian }?: { endian?: "big" | "little" }): Promise<object>;

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