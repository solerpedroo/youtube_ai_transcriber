import { describe, expect, it } from "vitest";
import { formatSubtitleClock, formatTimestamp } from "./time";

describe("formatTimestamp", () => {
  it("formats minutes and hours", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });

  it("guards invalid values", () => {
    expect(formatTimestamp(-1)).toBe("0:00");
    expect(formatTimestamp(Number.NaN)).toBe("0:00");
  });
});

describe("formatSubtitleClock", () => {
  it("formats SRT and VTT clocks", () => {
    expect(formatSubtitleClock(1.5, ",")).toBe("00:00:01,500");
    expect(formatSubtitleClock(3723.4, ".")).toBe("01:02:03.400");
  });
});
