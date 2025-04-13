# 🧰 BackupTool

A simple CLI file backup tool that supports snapshotting, incremental storage, restoration, pruning, and listing snapshots — all bundled into a single executable.

---

## 📆 Features

- 📓 Snapshot an entire directory
- 🕓 Restore from a specific snapshot
- 🚹 Prune unneeded snapshots and blobs
- 📋 List all snapshots with size info
- ✅ Packaged as a single executable via [`pkg`](https://github.com/vercel/pkg)

---

## 🚀 Building the Executable

Ensure you have:

- [Node.js 18+](https://nodejs.org/)
- [`pkg`](https://github.com/vercel/pkg):  
  ```bash
  npm install -g pkg
  ```
- [`esbuild`](https://esbuild.github.io/):  
  ```bash
  npm install --save-dev esbuild
  ```

### Build and Package (for your current platform):

```bash
make all
```

This will:
1. Bundle the code with `esbuild` → `dist/cli.js`
2. Compile a standalone binary → `backupTool`

---

## 🛠 Usage

Once built, run the CLI like this:

```bash
./backupTool <command> [options]
```

### 📸 `snapshot`

```bash
./backupTool snapshot --target-directory ./mydir
```

Takes a snapshot of the directory.

---

### ♻️ `restore`

```bash
./backupTool restore --snapshot-number 1 --output-directory ./restore
```

Restores snapshot 1 to the given directory.

---

### 🚹 `prune`

```bash
./backupTool prune --snapshot 1
```

Deletes snapshot 1 and any unreferenced blobs.

---

### 📋 `list`

```bash
./backupTool list
```

Lists all snapshots with size and distinct blob usage.

---

## 🧪 Testing

Run tests with:

```bash
npm run test
```

---

## 📂 Project Structure

```
.
├── src/
│   ├── cli.ts
│   ├── commands/
│   └── store/
├── dist/
│   └── cli.js (bundled by esbuild)
├── tests/
│   └── integration.test.ts
├── Makefile
└── README.md
```

---

## 📃 License

MIT License – use it, fork it, break it, improve it 🚀

