#!/usr/bin/env node
/**
 * Post-build cleanup: remove screenshot PNGs from out/screenshots/
 * so they don't count toward the Cloudflare Pages 20k file limit.
 * Raw screenshots are already excluded from the build, so this
 * only removes labeled PNGs that were copied into out/.
 */

import { readdir, unlink, rmdir, stat } from "node:fs/promises";
import { join } from "node:path";

const dir = "out/screenshots";

try {
  const entries = await readdir(dir);
  let removed = 0;

  for (const entry of entries) {
    if (!entry.endsWith(".png")) continue;
    await unlink(join(dir, entry));
    removed++;
  }

  // Remove directory if empty (ignore errors — may contain json manifests)
  try {
    const remaining = await readdir(dir);
    if (remaining.length === 0) {
      await rmdir(dir);
    }
  } catch {
    // directory already gone or not empty — fine
  }

  console.log(`clean-out-screenshots: removed ${removed} PNGs from ${dir}`);
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(`clean-out-screenshots: ${dir} does not exist, nothing to clean`);
  } else {
    throw err;
  }
}
