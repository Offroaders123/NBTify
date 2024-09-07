# NBTify

[![npm](https://img.shields.io/npm/v/nbtify.svg)](https://www.npmjs.com/package/nbtify)
[![downloads](https://img.shields.io/npm/dm/nbtify.svg)](https://www.npmjs.com/package/nbtify)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/nbtify/badge?style=rounded)](https://www.jsdelivr.com/package/npm/nbtify)

Following in the footsteps of [NBT.js](https://github.com/sjmulder/nbt-js) and [Prismarine-NBT](https://github.com/PrismarineJS/prismarine-nbt), NBTify is a JavaScript library that allows for the parsing of NBT files on the web!

I started this project as a learning experience to try and make my own NBT parser from scratch. I didn't have much success in making it work reliably, so I've decided to make a brand-new fork of NBT.js that will support Bedrock Edition's little endian NBT format, one of my goals that spurred the idea for making a new library.

Prismarine-NBT seemed like a viable option to NBT.js, as it supports both Bedrock and Java formats. However, it doesn't support the browser out of the box, and bundling it seems fairly bloated just to support the browser. NBT.js is really compact, so I didn't want to take the option with more dependencies.

I really like the functionality of Prismarine-NBT and the simplicity of NBT.js, so I thought, why not meet somewhere in the middle?

NBTify has entered the chat!

## Usage

### Import Resolutions

NBTify is fully [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) compatible, so everything will work in the browser and other environments, right out of the box! You don't need a backend or Node.js to use NBTify either, it's built on top of fully browser-compatible tech. You can edit NBT files right on the front-end itself!

All of the package's features are available as [named imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#forms_of_import_declarations), so you can decide whether you'd like to import them all to a [namespace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#forms_of_import_declarations), or only pick the ones you need individually.

When using a bundler, it's recommended practice to use named imports to help with [tree-shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) (NBTify is on the smaller side, but it's still good practice; I've been working on doing it lately too 🙂).

Modern builds rely on resolving the [`mutf-8`](https://github.com/sciencesakura/mutf-8) dependency. jsDelivr now supports bundles for ESM packages, so now it "just works" without any need for a bundler on your end, it's completely optional!

#### In the browser:

```html
<script type="module">
  // Static version (recommended 🏔️)
  import * as NBT from "https://cdn.jsdelivr.net/npm/nbtify@2.0.0/+esm";

  // Latest build (living on the edge 🧗)
  import * as NBT from "https://cdn.jsdelivr.net/npm/nbtify/+esm";
</script>
```

#### In Node (and friends), or with a bundler / [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap):

```ts
import * as NBT from "nbtify";
```

### Reading and writing files

With the intent of ensuring NBTify will work on both the front-end and the back-end, it is a non-goal for NBTify to interface with the network or file system for you.

It's up to you to find the best way to interface with how you will read and write files, NBTify is for reading, writing, and constructing data structures, similar to that of the [`JSON`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#static_methods) global, but for NBT.

#### Using the Fetch and File APIs (browser-friendly):

```ts
import { read, write, type NBTData } from "nbtify";

// Fetch the file data
const response: Response = await fetch("./bigtest.nbt");
const arrayBuffer: ArrayBuffer = await response.arrayBuffer();

// Read the NBT binary with NBTify
const data: NBTData = await read(arrayBuffer);

// Write the JavaScript object back to NBT binary
const result: Uint8Array = await write(data);

// Create a File object from the NBT binary data
const file: File = new File([result], "bigtest.nbt");

// ... further code to work with your new File object ...
```

#### Using the File System module in Node:

```ts
import { read, write, type NBTData } from "nbtify";
import { readFile, writeFile } from "node:fs/promises";

// Read the file data from the file system
const buffer: Buffer = await readFile("./bigtest.nbt");

// Read the NBT binary with NBTify
const data: NBTData = await read(buffer);

// Write the JavaScript object back to NBT binary
const result: Uint8Array = await write(data);

// Write the file data back to the file system
await writeFile("./bigtest.nbt", result);
```