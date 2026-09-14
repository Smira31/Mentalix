#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;

// A missing baseline is unsafe: let Vercel build rather than risk skipping a real change.
if (!previousSha || !commitSha) {
  process.exit(1);
}

let changedFiles;
try {
  changedFiles = execFileSync(
    "git",
    ["diff", "--name-only", `${previousSha}^0`, `${commitSha}^0`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  )
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
} catch {
  // A failed or unavailable diff must never suppress a deployment.
  process.exit(1);
}

if (changedFiles.length === 0) {
  process.exit(1);
}

const safeForSkip = (file) => {
  if (file === "vercel.json") return false;
  if (file.startsWith("docs/")) return true;
  if (file.startsWith(".github/")) return true;
  if (file.startsWith(".claude/")) return true;
  if (file.startsWith("audit-artifacts/")) return true;
  if (file.startsWith("qa-evidence/")) return true;
  // Root-level Markdown includes README and project notes, but not Markdown
  // imported from source directories where it could affect the frontend bundle.
  if (!file.includes("/") && file.endsWith(".md")) return true;
  return false;
};

// Vercel ignoreCommand: 0 means "ignore this deployment"; 1 means "build".
process.exit(changedFiles.every(safeForSkip) ? 0 : 1);
