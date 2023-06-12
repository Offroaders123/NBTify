// Demo

type OptionalPropertyNames<T> =
  { [K in keyof T]-?: ({} extends { [P in K]: T[K] } ? K : never) }[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> =
  { [P in K]: L[P] | Exclude<R[P], undefined> };

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type SpreadTwo<L, R> = Id<
  & Pick<L, Exclude<keyof L, keyof R>>
  & Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>>
  & Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>>
  & SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

type Spread<A extends readonly [...any]> =
  A extends [infer L, ...infer R]
    ? SpreadTwo<L, Spread<R>>
    : unknown
;

type Foo = Spread<[{ a: string }, { a?: number }]>

function merge<const A extends object[]>(...a: [...A]) {
  return Object.assign({}, ...a) as Spread<A>;
}

const merged = merge(
  { a: 42 },
  { b: "foo", a: "bar" },
  { c: true, b: 123 }
);

// My demo

type Name = string | null;
type Endian = "big" | "little";
type Compression = CompressionFormat | null;
type BedrockLevel = number | null;

interface FormatOptionsLike {
  readonly name: Name;
  readonly endian: Endian;
  readonly compression: Compression;
  readonly bedrockLevel: BedrockLevel;
}

type FormatOptions = Partial<FormatOptionsLike>;

const noice: FormatOptions = {};

interface NBTData<T extends object = any, U extends FormatOptions = FormatOptionsLike> {
  readonly data: T;
  readonly name: U["name"];
  readonly endian: U["endian"];
  readonly compression: U["compression"];
  readonly bedrockLevel: U["bedrockLevel"];
}

interface NBTDataConstructor {
  new <T extends object = any, const U extends FormatOptions = FormatOptionsLike>(data: T | NBTData<T>, options?: U): NBTData<T,Spread<[FormatOptionsLike,U]>>;
  prototype: NBTData;
}

declare var NBTData: NBTDataConstructor;

// Testing the demo

type Noice = { Noice: number; };
const compound: Noice = { Noice: 5 };

const demo1 = new NBTData(compound);
const demo2 = new NBTData(compound,{});
const demo3 = new NBTData(compound,{ name: "" });
const demo4 = new NBTData(compound,{ endian: "little", compression: "gzip" });

const demo5 = new NBTData(demo1,{  });
// not complete! should inherit properties 'endian' and 'compression' from demo4
const demo6 = new NBTData(demo4,{ name: "you betcha!" });

export {};