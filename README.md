# NBTify

[![npm](https://img.shields.io/npm/v/nbtify.svg)](https://www.npmjs.com/package/nbtify)
[![downloads](https://img.shields.io/npm/dm/nbtify.svg)](https://www.npmjs.com/package/nbtify)

Following in the footsteps of [NBT.js](https://github.com/sjmulder/nbt-js) and [Prismarine-NBT](https://github.com/PrismarineJS/prismarine-nbt), NBTify is a JavaScript library that allows for the parsing of NBT files on the web!

I started this project as a learning experience to try and make my own NBT parser from scratch. I didn't have much success in making it work reliably, so I've decided to make a brand-new fork of NBT.js that will support Bedrock Edition's little endian NBT format, one of my goals that spurred the idea for making a new library.

Prismarine-NBT seemed like a viable option to NBT.js, as it supports both Bedrock and Java formats. However, it doesn't support the browser out of the box, and bundling it seems fairly bloated just to support the browser. NBT.js is really compact, so I didn't want to take the option with more dependencies.

I really like the functionality of Prismarine-NBT and the simplicity of NBT.js, so I thought, why not meet somewhere in the middle?

NBTify has entered the chat!

## Usage

#### Importing NBTify in the browser:

```html
<script type="module">
  import * as NBT from "https://cdn.jsdelivr.net/npm/nbtify/dist/index.min.js";
</script>
```

#### Importing NBTify in Node:

```ts
import * as NBT from "nbtify";
```

#### Reading a file using the Fetch API in the browser:

```ts
const response: Response = await fetch("./bigtest.nbt");
const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
const data: NBTData = await NBT.read(arrayBuffer);
```

#### Reading a file using the File System module in Node:

```ts
import { readFile } from "node:fs/promises";

const buffer: Buffer = await readFile("./bigtest.nbt");
const data: NBTData = await NBT.read(buffer);
```

#### Writing to a file using the File API in the browser:

```ts
const result: Uint8Array = await NBT.write(data);
const file: File = new File([result],"bigtest.nbt");
```

#### Writing to a file using the File System module in Node:

```ts
import { writeFile } from "node:fs/promises";

const result: Uint8Array = await NBT.write(data);
await writeFile("./bigtest.nbt",result);
```