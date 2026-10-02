import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createJobDirectory, removeJobDirectory } from "./temp";
import { validateNetscapeCookies } from "./cookies-validate";

export { MAX_COOKIES_BYTES, validateNetscapeCookies } from "./cookies-validate";

/** Writes cookies into an existing job directory with restrictive permissions. */
export async function writeCookiesFile(jobDirectory: string, cookiesText: string): Promise<string> {
  const validated = validateNetscapeCookies(cookiesText);
  const cookiesPath = join(jobDirectory, "cookies.txt");
  await writeFile(cookiesPath, validated, { encoding: "utf8", mode: 0o600 });
  return cookiesPath;
}

/** Inserts `--cookies <path>` immediately before the trailing URL argument. */
export function withCookiesArg(args: readonly string[], cookiesPath?: string): string[] {
  if (!cookiesPath) return [...args];
  if (args.length === 0) return ["--cookies", cookiesPath];
  return [...args.slice(0, -1), "--cookies", cookiesPath, args[args.length - 1]!];
}

/**
 * Runs work with an optional temporary cookies file that is always deleted afterward.
 * Prefer writing into an existing job directory when one already exists.
 */
export async function withTemporaryCookies<T>(
  cookiesText: string | undefined,
  run: (cookiesPath: string | undefined) => Promise<T>,
): Promise<T> {
  if (!cookiesText?.trim()) {
    return run(undefined);
  }

  const jobDirectory = await createJobDirectory();
  try {
    const cookiesPath = await writeCookiesFile(jobDirectory, cookiesText);
    return await run(cookiesPath);
  } finally {
    await removeJobDirectory(jobDirectory);
  }
}
