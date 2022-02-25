# NBT Parser

Following in the footsteps of [NBT.js](https://github.com/sjmulder/nbt-js) and [Prismarine-NBT](https://github.com/PrismarineJS/prismarine-nbt), NBT Parser (tentative name as of now) is a JavaScript library that allows for the parsing of NBT files on the web!

I started this project as a learning experience to try and make my own NBT parser from scratch. I didn't have much success in making it work reliably, so I've decided to make a brand-new fork of NBT.js that will support Bedrock Edition's little endian NBT format, one of my goals that spurred the idea for making a new library.

Prismarine-NBT seemed like a viable option to NBT.js, as it supports both Bedrock and Java formats. However, it doesn't support the browser out of the box, and bundling it seems fairly bloated just to support the browser. NBT.js is really compact, so I didn't want to take the option with more dependencies.

I really like the functionality of Prismarine-NBT and the simplicity of NBT.js, so I thought, why not meet somewhere in the middle?

NBT Parser has entered the chat!