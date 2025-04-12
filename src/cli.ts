import { Command } from "commander";
import { snapshot } from "./commands/snapshot";
import { restore } from "./commands/restore";
import { listSnapshots } from "./commands/list";
import { prune } from "./commands/prune";

const program = new Command();

program
  .name("backuptool")
  .description("A simple CLI file backup tool with snapshotting")
  .version("0.1.0");

program
  .command("snapshot")
  .requiredOption("--target-directory <path>", "Target directory to snapshot")
  .action((opts) => snapshot(opts.targetDirectory));

program
  .command("restore")
  .requiredOption("--snapshot-number <number>", "Snapshot number to restore")
  .requiredOption("--output-directory <path>", "Directory to restore to")
  .action((opts) => restore(parseInt(opts.snapshotNumber), opts.outputDirectory));

program
  .command("list")
  .description("List all snapshots")
  .action(() => listSnapshots());

program
  .command("prune")
  .requiredOption("--snapshot <number>", "Snapshot number to prune")
  .action((opts) => prune(parseInt(opts.snapshot)));

program
  .arguments("<command>")
  .action(() => {
    console.error("❌ Unknown command. Use --help to see available options.");
    program.help({ error: true });
  });

if (process.argv.length <= 2) {
  program.help(); // no command provided
}

program.parse(process.argv);
