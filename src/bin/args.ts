const SNBT_PATTERN = /^--snbt$/;
const NBT_PATTERN = /^--nbt$/;

const args: string[] = process.argv.slice(2);

process.on("uncaughtException",error => {
  console.error(`${error}`);
  process.exit(1);
});

export const file: string = args.shift() ?? (() => {
  throw new TypeError("Missing argument 'input'");
})();

for (const arg of args){
  switch (true){
    case SNBT_PATTERN.test(arg):
    case NBT_PATTERN.test(arg):
      break;
    default:
      throw new TypeError(`Unexpected argument '${arg}'`);
  }
}

export const snbt: boolean = args.some(arg => SNBT_PATTERN.test(arg));
export const nbt: boolean = args.some(arg => NBT_PATTERN.test(arg));