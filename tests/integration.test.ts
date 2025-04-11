import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";

const run = promisify(exec);
const backupTool = (args: string) => `npx tsx src/cli.ts ${args}`;
const TMP = "tmp_test";
const SRC = path.join(TMP, "src");
const OUT = path.join(TMP, "out");

async function reset() {
  await fs.rm(TMP, { recursive: true, force: true });
  await fs.rm(".backup", { recursive: true, force: true });
}

async function writeFiles(fileMap: Record<string, string | Buffer>) {
  await fs.mkdir(SRC, { recursive: true });
  for (const [filename, content] of Object.entries(fileMap)) {
    const fullPath = path.join(SRC, filename);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }
}

function getBlobCount(): Promise<number> {
  return fs.readdir(".backup/blobs").then((files) => files.length);
}

function sha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

describe("BackupTool Integration", () => {
  beforeEach(reset);
  afterEach(reset);

  it("restores files identically", async () => {
    await writeFiles({
      "file.txt": "hello world",
      "nested/file2.txt": "hello again"
    });

    await run(backupTool(`snapshot --target-directory=${SRC}`));
    await run(backupTool(`restore --snapshot-number=1 --output-directory=${OUT}`));

    const orig = await fs.readFile(path.join(SRC, "file.txt"), "utf8");
    const restored = await fs.readFile(path.join(OUT, "file.txt"), "utf8");
    expect(restored).toBe(orig);

    const nested = await fs.readFile(path.join(OUT, "nested/file2.txt"), "utf8");
    expect(nested).toBe("hello again");
  });

  it("does not duplicate unchanged blobs across snapshots", async () => {
    await writeFiles({ "file.txt": "unchanged" });
    await run(backupTool(`snapshot --target-directory=${SRC}`));
    const before = await getBlobCount();

    await run(backupTool(`snapshot --target-directory=${SRC}`));
    const after = await getBlobCount();

    expect(after).toBe(before); // No new blobs for unchanged content
  });

  it("creates new blob when file content changes", async () => {
    await writeFiles({ "file.txt": "A" });
    await run(backupTool(`snapshot --target-directory=${SRC}`));
    const before = await getBlobCount();

    await writeFiles({ "file.txt": "B" });
    await run(backupTool(`snapshot --target-directory=${SRC}`));
    const after = await getBlobCount();

    expect(after).toBe(before + 1);
  });

  it("deletes unreferenced blobs when pruning", async () => {
    await writeFiles({ "a.txt": "A", "b.txt": "B" });
    await run(backupTool(`snapshot --target-directory=${SRC}`)); // Snapshot 1

    await writeFiles({ "a.txt": "A", "b.txt": "C" });
    await run(backupTool(`snapshot --target-directory=${SRC}`)); // Snapshot 2

    const before = await getBlobCount();

    await run(backupTool(`prune --snapshot=2`));
    const after = await getBlobCount();

    expect(after).toBeLessThan(before); // Blob for "C" should be deleted
  });

  it("keeps shared blobs after pruning another snapshot", async () => {
    await writeFiles({ "shared.txt": "shared", "unique1.txt": "one" });
    await run(backupTool(`snapshot --target-directory=${SRC}`)); // Snapshot 1
  
    await writeFiles({ "shared.txt": "shared", "unique2.txt": "two" });
    await run(backupTool(`snapshot --target-directory=${SRC}`)); // Snapshot 2
  
    await run(backupTool(`prune --snapshot=1`));
  
    const sharedHash = sha256("shared");
    const blobs = await fs.readdir(".backup/blobs");
  
    expect(blobs).toContain(sharedHash); // Verify blob still exists
  });
  
  it("can snapshot and restore binary content", async () => {
    const binary = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    await writeFiles({ "binary.dat": binary });

    await run(backupTool(`snapshot --target-directory=${SRC}`));
    await run(backupTool(`restore --snapshot-number=1 --output-directory=${OUT}`));

    const restored = await fs.readFile(path.join(OUT, "binary.dat"));
    expect(restored.equals(binary)).toBe(true);
  });
});
