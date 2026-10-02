export type SubtitleKind = "manual" | "auto";

export type SubtitleTrack = {
  language: string;
  name?: string;
  kind: SubtitleKind;
};

export type SelectedSubtitle = {
  language: string;
  kind: SubtitleKind;
};

export type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};
