// data-backing (I want to move the readers/writers here too)

export enum ByteType {
  Uint8 = 1,
  Int8 = 1,
  Uint16 = 2,
  Int16 = 2,
  Uint32 = 4,
  Int32 = 4,
  Float32 = 4,
  Float64 = 8,
  BigUint64 = 8,
  BigInt64 = 8,
}