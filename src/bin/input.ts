import { stdin, stdout } from "node:process";
import { promisify } from "node:util";

export async function readStdin(): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function writeStdout(data: string | Uint8Array): Promise<void> {
  await stdoutWriteAsync(data);
}

const stdoutWriteAsync: (data: string | Uint8Array) => Promise<void> = promisify(stdout.write.bind(stdout));