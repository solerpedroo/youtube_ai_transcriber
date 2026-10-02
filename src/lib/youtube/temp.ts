import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEMP_PREFIX = "youtube-ai-";

export async function createJobDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), TEMP_PREFIX));
}

/** Always call from a finally block; cleanup failure must not mask the original error. */
export async function removeJobDirectory(jobDirectory: string): Promise<void> {
  await rm(jobDirectory, { recursive: true, force: true });
}
