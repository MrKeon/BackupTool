import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function* walkDirectory(dir: string, base = dir): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    const relPath = path.relative(base, absPath);

    if (entry.isDirectory()) {
      yield* walkDirectory(absPath, base);
    } else if (entry.isFile()) {
      yield relPath;
    }
  }
}

export async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}
  
export function nowTimestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}
