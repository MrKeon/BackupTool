import fs from "fs/promises";
import path from "path";
import { ensureDir, nowTimestamp } from "./helpers";

const BASE_DIR = ".backup";
const SNAPSHOTS_DIR = path.join(BASE_DIR, "snapshots");
const BLOBS_DIR = path.join(BASE_DIR, "blobs");

export async function storeBlobIfMissing(hash: string, content: Buffer) {
    await ensureDir(BLOBS_DIR); // Ensure directory exists before writing
  
    const blobPath = path.join(BLOBS_DIR, hash);
    try {
      await fs.access(blobPath); // already exists
    } catch {
      await fs.writeFile(blobPath, content); // write blob if missing
    }
  }
  
export async function saveSnapshot(files: Record<string, string>): Promise<number> {
  await ensureDir(SNAPSHOTS_DIR);
  await ensureDir(BLOBS_DIR);

  const timestamp = nowTimestamp();
  const snapshotNumber = await getNextSnapshotNumber();

  const snapshotData = {
    number: snapshotNumber,
    timestamp,
    files,
  };

  const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotNumber}.json`);
  await fs.writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2));

  return snapshotNumber;
}

async function getNextSnapshotNumber(): Promise<number> {
  try {
    const files = await fs.readdir(SNAPSHOTS_DIR);
    const numbers = files.map(f => parseInt(f)).filter(n => !isNaN(n));
    return numbers.length ? Math.max(...numbers) + 1 : 1;
  } catch {
    return 1;
  }
}

export async function getSnapshotByNumber(number: number): Promise<{
    number: number;
    timestamp: string;
    files: Record<string, string>;
  } | null> {
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${number}.json`);
    try {
        const data = await fs.readFile(snapshotPath, "utf-8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function getBlobPath(hash: string): string {
    return path.join(BLOBS_DIR, hash);
}
  
  
