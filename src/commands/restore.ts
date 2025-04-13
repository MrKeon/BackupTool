import fs from "fs/promises";
import path from "path";
import { getSnapshotByNumber, getBlobPath } from "../store";
import { ensureDir } from '../store/helpers'

export async function restore(snapshotNumber: number, outputDir: string) {
  const snapshot = await getSnapshotByNumber(snapshotNumber);
  if (!snapshot) {
    console.error(`Snapshot ${snapshotNumber} not found.`);
    return;
  }

  for (const [relativePath, hash] of Object.entries(snapshot.files)) {
    const blobPath = getBlobPath(hash);
    const targetPath = path.join(outputDir, relativePath);

    // Ensure the subdirectory exists
    await ensureDir(path.dirname(targetPath));

    // Copy content to the output file
    const content = await fs.readFile(blobPath);
    await fs.writeFile(targetPath, content);
  }

  console.log(`Snapshot ${snapshotNumber} restored to ${outputDir}`);
}
