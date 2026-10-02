import { describe, expect, it } from "vitest";
import { resolveTheme } from "./resolve-theme";

describe("resolveTheme", () => {
  it("honors explicit light and dark preferences", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system preference when theme is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});
