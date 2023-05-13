// @ts-check
// https://www.jasnell.me/posts/webstreams
// $ tsx --watch ./this-file.mts

import { randomFill } from "node:crypto";

/**
 * The raw bytes from the `hello_world.nbt` demo file.
*/
export const helloWorld = new Uint8Array([
  10,   0,  11, 104, 101, 108, 108, 111,
  32, 119, 111, 114, 108, 100,   8,   0,
   4, 110,  97, 109, 101,   0,   9,  66,
  97, 110,  97, 110, 114,  97, 109,  97,
   0
]);
// console.log(helloWorld);

const readable = new ReadableStream({
  type: "bytes",

  pull(controller) {
    const byobRequest = controller.byobRequest;
    return new Promise((resolve, reject) => {
      randomFill(byobRequest.view, (err) => {
        if (err) return reject(err);
        byobRequest.respond(byobRequest.view.byteLength);
        resolve();
      });
    });
  }
});

const reader = readable.getReader({ mode: "byob" });

console.log(await reader.read(helloWorld));