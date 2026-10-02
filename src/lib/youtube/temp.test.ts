import { access, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createJobDirectory, removeJobDirectory } from "./temp";

describe("temporary job directories", () => {
  it("creates and removes an isolated directory", async () => {
    const directory = await createJobDirectory();
    const filePath = `${directory}/metadata.json`;
    await writeFile(filePath, "{}", "utf8");
    await expect(removeJobDirectory(directory)).resolves.toBe(true);
    await expect(access(filePath)).rejects.toThrow();
  });

  it("refuses to delete a path outside its temporary namespace", async () => {
    await expect(removeJobDirectory(tmpdir())).resolves.toBe(false);
  });
});
