import { describe, expect, it } from "vitest";
import { parseVtt } from "./vtt";

const SAMPLE = `WEBVTT

1
00:00:01.000 --> 00:00:03.500
Hello <b>world</b>

00:00:04.000 --> 00:00:06.000 align:start position:0%
Second
line

NOTE this is ignored

01:02:03.400 --> 01:02:05.500
Hourly cue
`;

describe("parseVtt", () => {
  it("extracts timed text and strips markup", () => {
    expect(parseVtt(SAMPLE)).toEqual([
      { start: 1, end: 3.5, text: "Hello world" },
      { start: 4, end: 6, text: "Second line" },
      { start: 3723.4, end: 3725.5, text: "Hourly cue" },
    ]);
  });

  it("ignores invalid or empty cues", () => {
    expect(parseVtt(`WEBVTT

00:00:02.000 --> 00:00:01.000
Backwards

00:00:03.000 --> 00:00:04.000

`)).toEqual([]);
  });
});
