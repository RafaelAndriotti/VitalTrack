// Portable test runner: lists test/*.test.ts itself instead of relying on
// shell/Node glob expansion (`tsx --test test/*.test.ts` needs Node 21+ globs
// and a shell that expands them). Equivalent to `tsx --test <files>`.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const testDir = join(root, "test");
const files = readdirSync(testDir)
  .filter((f) => f.endsWith(".test.ts"))
  .sort()
  .map((f) => join("test", f));

if (files.length === 0) {
  console.error("No test files found in test/");
  process.exit(1);
}

if (process.argv.includes("--list")) {
  console.log(files.join("\n"));
  process.exit(0);
}

const res = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  cwd: root,
  stdio: "inherit",
});
process.exit(res.status ?? 1);
