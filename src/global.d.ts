declare global {
  interface ArrayBuffer {
    toString(): "[object ArrayBuffer]";
  }
}

export {};