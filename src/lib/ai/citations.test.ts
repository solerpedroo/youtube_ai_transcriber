import { describe, expect, it } from "vitest";
import { contentToMarkdownWithSeekLinks, extractCitations, splitContentWithCitations } from "./citations";

describe("extractCitations", () => {
  it("parses minute and hour timestamps uniquely", () => {
    expect(extractCitations("See [12:31] and later [1:02:03], then [12:31] again.")).toEqual([
      { start: 751 },
      { start: 3_723 },
    ]);
  });
});

describe("contentToMarkdownWithSeekLinks", () => {
  it("converts timestamp markers into seek links", () => {
    expect(contentToMarkdownWithSeekLinks("Veja [1:02:03] aqui.")).toBe(
      "Veja [1:02:03](#seek-3723) aqui.",
    );
  });
});

describe("splitContentWithCitations", () => {
  it("keeps surrounding text and citation parts", () => {
    expect(splitContentWithCitations("Start [0:05] end")).toEqual([
      { type: "text", value: "Start " },
      { type: "citation", seconds: 5, label: "0:05" },
      { type: "text", value: " end" },
    ]);
  });
});
