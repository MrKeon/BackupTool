import fs from "fs/promises";
import path from "path";

const SNAPSHOTS_DIR = ".backup/snapshots";
const BLOBS_DIR = ".backup/blobs";

interface Snapshot {
  number: number;
  timestamp: string;
  files: Record<string, string>;
}

export async function listSnapshots() {
  try {
    const files = await fs.readdir(SNAPSHOTS_DIR);
    const snapshotFiles = files
      .filter(f => f.endsWith(".json"))
      .sort((a, b) => parseInt(a) - parseInt(b));

    const snapshots: Snapshot[] = [];

    for (const file of snapshotFiles) {
      const content = await fs.readFile(path.join(SNAPSHOTS_DIR, file), "utf-8");
      snapshots.push(JSON.parse(content));
    }

    // Count how many snapshots reference each blob
    const blobUsageCount: Record<string, number> = {};
    for (const snapshot of snapshots) {
      for (const hash of Object.values(snapshot.files)) {
        blobUsageCount[hash] = (blobUsageCount[hash] || 0) + 1;
      }
    }

    console.log("SNAPSHOT  TIMESTAMP            SIZE    DISTINCT_SIZE");

    let totalDiskSize = 0;

    for (const snapshot of snapshots) {
      let totalSize = 0;
      let distinctSize = 0;

      for (const [_, hash] of Object.entries(snapshot.files)) {
        const blobPath = path.join(BLOBS_DIR, hash);
        try {
          const stat = await fs.stat(blobPath);
          totalSize += stat.size;
          if (blobUsageCount[hash] === 1) {
            distinctSize += stat.size;
          }
        } catch {
          // Blob missing — skip
        }
      }

      totalDiskSize += distinctSize;

      console.log(
        `${String(snapshot.number).padEnd(9)} ${snapshot.timestamp.padEnd(20)} ${String(totalSize).padEnd(7)} ${distinctSize}`
      );
    }

    console.log(`total`.padEnd(31) + `${totalDiskSize}`);
  } catch (err: any) {
    console.error("Error listing snapshots:", err.message);
  }
}
