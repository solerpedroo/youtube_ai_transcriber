import { access, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  withCookiesArg,
  withTemporaryCookies,
  writeCookiesFile,
} from "./cookies";
import { validateNetscapeCookies } from "./cookies-validate";
import { createJobDirectory, removeJobDirectory } from "./temp";

const SAMPLE = [
  "# Netscape HTTP Cookie File",
  ".youtube.com\tTRUE\t/\tTRUE\t2147483647\tSID\tabc123",
  ".youtube.com\tTRUE\t/\tFALSE\t2147483647\tPREF\tf1=500",
].join("\n");

describe("validateNetscapeCookies", () => {
  it("accepts Netscape cookie files with tab-separated fields", () => {
    expect(validateNetscapeCookies(SAMPLE)).toContain("SID\tabc123");
  });

  it("rejects empty, oversized, or non-Netscape payloads", () => {
    expect(() => validateNetscapeCookies("")).toThrow(/cookies\.txt/);
    expect(() => validateNetscapeCookies("just-a-token")).toThrow(/Netscape/);
    expect(() => validateNetscapeCookies("a".repeat(1_048_577))).toThrow(/tamanho máximo/);
  });
});

describe("cookie helpers", () => {
  it("writes cookies with restrictive permissions and cleans temporary dirs", async () => {
    const directory = await createJobDirectory();
    const path = await writeCookiesFile(directory, SAMPLE);
    await expect(readFile(path, "utf8")).resolves.toContain("PREF\tf1=500");
    await expect(removeJobDirectory(directory)).resolves.toBe(true);
    await expect(access(path)).rejects.toThrow();
  });

  it("inserts --cookies before the trailing URL", () => {
    expect(withCookiesArg(["--skip-download", "https://youtu.be/abc"], "/tmp/cookies.txt")).toEqual([
      "--skip-download",
      "--cookies",
      "/tmp/cookies.txt",
      "https://youtu.be/abc",
    ]);
  });

  it("runs work without creating a directory when cookies are absent", async () => {
    await expect(withTemporaryCookies(undefined, async (path) => path)).resolves.toBeUndefined();
  });
});
