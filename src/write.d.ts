import TypedArray from "./TypedArray";

export declare function write(data: object,{ endian, encoding }?: { endian?: "big" | "little"; encoding?: "gzip" | "deflate" | "deflate-raw"; }): Promise<ArrayBuffer | TypedArray>;

export declare class Writer {
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