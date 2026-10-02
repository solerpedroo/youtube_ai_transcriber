export const SUGGESTED_CHAT_ACTIONS = [
  {
    id: "summarize",
    label: "Resumir vídeo",
    prompt: "Create a structured summary of this video using the transcript.",
  },
  {
    id: "explain",
    label: "Explicar de forma simples",
    prompt: "Explain the main ideas of this video in simple language using the transcript.",
  },
  {
    id: "notes",
    label: "Notas de estudo",
    prompt: "Transform the transcript into concise study notes organized by topic.",
  },
  {
    id: "topics",
    label: "Tópicos principais",
    prompt: "List the main topics covered in this video based on the transcript.",
  },
  {
    id: "quiz",
    label: "Criar quiz",
    prompt: "Generate 10 questions about the video and provide the answers separately.",
  },
  {
    id: "timestamps",
    label: "Timestamps importantes",
    prompt: "Identify the most important parts of the video and return their timestamps.",
  },
] as const;
