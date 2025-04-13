import path from "path";
import { promises as fs } from "fs";
import { saveSnapshot, storeBlobIfMissing } from "../store";
import { hashBuffer, walkDirectory } from "../store/helpers";

export async function snapshot(targetDirectory: string) {
  const files: Record<string, string> = {};

  for await (const filePath of walkDirectory(targetDirectory)) {
    const fullPath = path.resolve(targetDirectory, filePath);
    const content = await fs.readFile(fullPath);
    const hash = hashBuffer(content);

    await storeBlobIfMissing(hash, content);

    files[filePath] = hash;
  }

  const snapshotNumber = await saveSnapshot(files);
  console.log(`Snapshot ${snapshotNumber} saved.`);
}
