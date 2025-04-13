import fs from "fs/promises";
import path from "path";

const BASE_DIR = ".backup";
const SNAPSHOTS_DIR = path.join(BASE_DIR, "snapshots");
const BLOBS_DIR = path.join(BASE_DIR, "blobs");

export async function prune(snapshotNumber: number) {
  const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotNumber}.json`);

  // Load snapshot to be pruned
  let snapshotToDelete;
  try {
    const raw = await fs.readFile(snapshotPath, "utf-8");
    snapshotToDelete = JSON.parse(raw);
  } catch {
    console.error(`Snapshot ${snapshotNumber} not found.`);
    return;
  }

  // Delete the snapshot file
  await fs.unlink(snapshotPath);
  console.log(`Snapshot ${snapshotNumber} deleted.`);

  // Recompute used blobs from all remaining snapshots
  const usedBlobs = new Set<string>();
  const allSnapshots = await fs.readdir(SNAPSHOTS_DIR);

  for (const file of allSnapshots) {
    const content = await fs.readFile(path.join(SNAPSHOTS_DIR, file), "utf-8");
    const { files } = JSON.parse(content);
    Object.values(files as string[]).forEach((hash: string) => usedBlobs.add(hash));
  }

  // Now delete any blobs no longer referenced
  const toDelete = Object.values(snapshotToDelete.files as string[]).filter((hash: string) => !usedBlobs.has(hash));

  for (const hash of toDelete) {
    const blobPath = path.join(BLOBS_DIR, hash);
    try {
      await fs.unlink(blobPath);
      console.log(`Unreferenced blob deleted: ${hash}`);
    } catch {
      console.warn(`Blob not found or already deleted: ${hash}`);
    }
  }
}
