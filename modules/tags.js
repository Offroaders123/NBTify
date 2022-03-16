/* A mapping from type names to NBT type numbers. */
export const tags = {
  end: 0,
  byte: 1,
  short: 2,
  int: 3,
  long: 4,
  float: 5,
  double: 6,
  byteArray: 7,
  string: 8,
  list: 9,
  compound: 10,
  intArray: 11,
  longArray: 12
};

/* A mapping from NBT type numbers to type names. */
export const names = Object.fromEntries(Object.entries(tags).map(array => array.reverse()));