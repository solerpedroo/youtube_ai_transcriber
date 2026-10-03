import type { AppSettings } from "@/types";

export const API_KEYS_SESSION_STORAGE_KEY = "youtube-ai-transcriber-api-keys";

type SessionApiKeys = {
  chatApiKey: string;
  transcriptionApiKey: string;
};

function readSessionKeys(): SessionApiKeys {
  if (typeof window === "undefined") {
    return { chatApiKey: "", transcriptionApiKey: "" };
  }
  try {
    const raw = window.sessionStorage.getItem(API_KEYS_SESSION_STORAGE_KEY);
    if (!raw) return { chatApiKey: "", transcriptionApiKey: "" };
    const parsed = JSON.parse(raw) as Partial<SessionApiKeys>;
    return {
      chatApiKey: typeof parsed.chatApiKey === "string" ? parsed.chatApiKey : "",
      transcriptionApiKey: typeof parsed.transcriptionApiKey === "string" ? parsed.transcriptionApiKey : "",
    };
  } catch {
    return { chatApiKey: "", transcriptionApiKey: "" };
  }
}

function writeSessionKeys(keys: SessionApiKeys): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(API_KEYS_SESSION_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // sessionStorage may be unavailable in strict privacy modes.
  }
}

export function stripApiKeysFromSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    chatProvider: { ...settings.chatProvider, apiKey: "" },
    transcriptionProvider: { ...settings.transcriptionProvider, apiKey: "" },
  };
}

export function mergeApiKeysIntoSettings(settings: AppSettings): AppSettings {
  const session = readSessionKeys();
  const chatApiKey = session.chatApiKey || settings.chatProvider.apiKey;
  const transcriptionApiKey = session.transcriptionApiKey || settings.transcriptionProvider.apiKey;

  if (chatApiKey || transcriptionApiKey) {
    writeSessionKeys({
      chatApiKey: chatApiKey || session.chatApiKey,
      transcriptionApiKey: transcriptionApiKey || session.transcriptionApiKey,
    });
  }

  return {
    ...settings,
    chatProvider: { ...settings.chatProvider, apiKey: chatApiKey },
    transcriptionProvider: { ...settings.transcriptionProvider, apiKey: transcriptionApiKey },
  };
}

export function persistApiKeysFromSettings(settings: AppSettings): void {
  writeSessionKeys({
    chatApiKey: settings.chatProvider.apiKey,
    transcriptionApiKey: settings.transcriptionProvider.apiKey,
  });
}
