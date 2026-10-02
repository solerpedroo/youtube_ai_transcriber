import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const TEMP_PREFIX = "youtube-ai-";

export async function createJobDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), TEMP_PREFIX));
}

/** Safe for finally blocks: refuses unsafe paths and reports cleanup failure without throwing. */
export async function removeJobDirectory(jobDirectory: string): Promise<boolean> {
  const expectedPrefix = `${resolve(tmpdir())}${sep}${TEMP_PREFIX}`;
  const resolvedDirectory = resolve(jobDirectory);
  const comparableDirectory = process.platform === "win32" ? resolvedDirectory.toLowerCase() : resolvedDirectory;
  const comparablePrefix = process.platform === "win32" ? expectedPrefix.toLowerCase() : expectedPrefix;
  if (!comparableDirectory.startsWith(comparablePrefix)) {
    return false;
  }
  try {
    await rm(resolvedDirectory, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
