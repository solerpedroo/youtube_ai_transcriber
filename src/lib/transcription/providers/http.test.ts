import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { transcribeWithOpenAiCompatibleApi } from "./http";

describe("transcribeWithOpenAiCompatibleApi", () => {
  const directories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
  });

  async function createAudioFile(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "youtube-ai-provider-"));
    directories.push(directory);
    const filePath = join(directory, "chunk.mp3");
    await writeFile(filePath, Buffer.from("fake-audio"));
    return filePath;
  }

  it("parses verbose_json segments from a successful provider response", async () => {
    const filePath = await createAudioFile();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer sk-test");
      expect(init?.body).toBeInstanceOf(FormData);
      return new Response(JSON.stringify({
        text: "Hello world",
        language: "en",
        segments: [
          { start: 0, end: 1.5, text: "Hello" },
          { start: 1.5, end: 3, text: "world" },
        ],
      }), { status: 200 });
    });

    await expect(
      transcribeWithOpenAiCompatibleApi(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        filePath,
        { apiKey: "sk-test", model: "whisper-large-v3-turbo" },
      ),
    ).resolves.toEqual({
      language: "en",
      fullText: "Hello world",
      segments: [
        { id: "provider-1", start: 0, end: 1.5, text: "Hello" },
        { id: "provider-2", start: 1.5, end: 3, text: "world" },
      ],
    });
  });

  it("maps unauthorized and rate-limited provider responses", async () => {
    const filePath = await createAudioFile();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }));

    await expect(
      transcribeWithOpenAiCompatibleApi(
        "https://api.openai.com/v1/audio/transcriptions",
        filePath,
        { apiKey: "sk-test", model: "whisper-1" },
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_AUTH_FAILED" });

    await expect(
      transcribeWithOpenAiCompatibleApi(
        "https://api.openai.com/v1/audio/transcriptions",
        filePath,
        { apiKey: "sk-test", model: "whisper-1" },
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
