export function write(data: {}, { endian, encoding }?: { endian?: "big" | "little"; encoding?: "deflate" | "gzip"; }): Promise<ArrayBuffer | Uint8Array>;

export class Writer {
  constructor(endian: "big" | "little");
  offset: number;
  endian: boolean;
  buffer: ArrayBuffer;
  view: DataView;
  data: Uint8Array;
  accommodate(size: number): void;
  getData(): Uint8Array;
  byte(value: number): void;
  short(value: number): void;
  int(value: number): void;
  float(value: number): void;
  double(value: number): void;
  long(value: number): void;
  byteArray(value: []): void;
  intArray(value: []): void;
  longArray(value: []): void;
  string(value: string): void;
  list(value: []): void;
  compound(value: {}): void;
}