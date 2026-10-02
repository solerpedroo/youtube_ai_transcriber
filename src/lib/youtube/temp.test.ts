import { access, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createJobDirectory, removeJobDirectory } from "./temp";

describe("temporary job directories", () => {
  it("creates and removes an isolated directory", async () => {
    const directory = await createJobDirectory();
    const filePath = `${directory}/metadata.json`;
    await writeFile(filePath, "{}", "utf8");
    await removeJobDirectory(directory);
    await expect(access(filePath)).rejects.toThrow();
  });
});
