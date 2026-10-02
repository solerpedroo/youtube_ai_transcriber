# YouTube AI Transcriber

## 1. Project objective

Build a local-first web application where the user can paste a YouTube URL and:

1. Load basic video information.
2. Obtain the video's audio.
3. Transcribe the entire video.
4. Store the transcription locally.
5. Display the transcription with timestamps.
6. Open an AI chat beside the transcription.
7. Ask questions about the video.
8. Generate summaries, explanations, study notes and answers grounded exclusively in the transcription.
9. Support multiple AI providers through user-provided API keys.
10. Support public, unlisted and authenticated/private YouTube videos when the user has legitimate access.

The application should remain relatively simple and should not require a database.

---

# 2. Main stack

## Frontend / Full-stack framework

- Next.js latest stable version
- App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Local persistence

Use:

```text
localStorage
```

for:

- imported videos;
- transcripts;
- chat conversations;
- AI provider configuration;
- selected models;
- UI preferences;
- transcription metadata.

Do NOT introduce:

- PostgreSQL;
- Supabase;
- Firebase;
- MongoDB;
- Prisma;

for the MVP.

---

# 3. Server-side utilities

The server is only responsible for temporary processing.

Use:

```text
yt-dlp
ffmpeg
```

The backend must NOT permanently store video or audio.

Processing flow:

```text
YouTube URL
    ↓
yt-dlp
    ↓
metadata
    ↓
audio extraction
    ↓
ffmpeg normalization
    ↓
audio chunks
    ↓
Speech-to-Text provider
    ↓
transcript
    ↓
return transcript to browser
    ↓
save in localStorage
```

Temporary files should be stored under something such as:

```text
/tmp/youtube-ai/{jobId}
```

After transcription:

```text
delete audio
delete chunks
delete metadata temporary files
delete cookies temporary file
```

Use `finally` cleanup logic so temporary files are removed even when a request fails.

---

# 4. YouTube support

Supported initially:

```text
Public videos
Unlisted videos
Private videos that the user can legitimately access
Age-restricted videos when authentication allows access
```

Do not claim that every video can always be downloaded.

Possible errors:

```text
Video unavailable
Private video without authentication
Members-only content
Geographic restriction
YouTube anti-bot restriction
Authentication expired
Video removed
Unsupported live stream
```

Present these errors properly to the user.

---

# 5. Authentication for private videos

Do NOT implement YouTube username/password authentication.

Support optional YouTube authentication using a Netscape-format cookies file.

UI:

```text
Settings
   YouTube Access
      [ Upload cookies.txt ]
```

Cookies must:

- never be persisted in localStorage;
- never be logged;
- never be committed;
- only exist temporarily while processing;
- be removed immediately after the job.

Possible server-side command:

```bash
yt-dlp --cookies /tmp/cookies.txt ...
```

Public/unlisted videos should work without cookies whenever possible.

---

# 6. Video import page

Main screen:

```text
┌───────────────────────────────────────────────────────┐
│ YouTube AI Transcriber                               │
│                                                       │
│ [ Paste YouTube URL............................. ]    │
│                                                       │
│                     [ Import Video ]                  │
└───────────────────────────────────────────────────────┘
```

After URL validation:

display:

```text
Thumbnail
Video title
Channel
Duration
URL
```

Actions:

```text
Transcribe
Cancel
```

---

# 7. Transcription workflow

When the user selects `Transcribe`:

### Step 1

Validate YouTube URL.

Accept formats including:

```text
youtube.com/watch?v=
youtu.be/
youtube.com/shorts/
youtube.com/live/
```

### Step 2

Retrieve metadata using:

```bash
yt-dlp --dump-json
```

Extract at minimum:

```ts
interface VideoMetadata {
  videoId: string
  title: string
  channel?: string
  duration: number
  thumbnail?: string
  url: string
}
```

### Step 3

Check for existing subtitles.

Priority:

```text
1. manually uploaded subtitles
2. automatic YouTube captions
3. audio transcription
```

If usable subtitles exist, allow:

```text
Use existing subtitles
Generate new AI transcription
```

Using subtitles can dramatically reduce transcription cost.

### Step 4

If transcription is required, download audio only.

Example concept:

```bash
yt-dlp -f bestaudio -x --audio-format mp3 URL
```

Do not download video when audio is sufficient.

### Step 5

Normalize audio using ffmpeg.

Target:

```text
mono
16 kHz or provider-compatible sample rate
compressed audio
speech optimized
```

### Step 6

Split large audio.

Example target:

```text
5-10 minute chunks
```

Do not rely only on file size.

Maintain each chunk's offset:

```ts
interface AudioChunk {
  index: number
  startSeconds: number
  endSeconds: number
  path: string
}
```

### Step 7

Transcribe each chunk sequentially or with controlled concurrency.

Do NOT fire dozens of provider requests simultaneously.

Suggested concurrency:

```text
2-3 chunks
```

Combine results afterward.

---

# 8. Transcript structure

Do not save only one giant string.

Store structured segments.

```ts
interface TranscriptSegment {
  id: string

  start: number
  end: number

  text: string
}
```

Full transcript:

```ts
interface Transcript {
  id: string
  videoId: string
  language?: string

  segments: TranscriptSegment[]

  fullText: string

  createdAt: string
}
```

Example:

```json
{
  "start": 124.3,
  "end": 130.8,
  "text": "Neural networks are composed of multiple layers."
}
```

---

# 9. Timestamp UI

Display transcription as:

```text
00:00 Introduction to neural networks

00:37 What artificial intelligence means

01:42 Supervised learning

03:18 Training neural networks
```

Clicking a timestamp should move the embedded YouTube player to that location.

Use the YouTube iframe API if practical.

Desired behavior:

```text
click 03:18
        ↓
player.seekTo(198)
```

---

# 10. Workspace interface

Main workspace:

```text
┌──────────────────────────────────┬─────────────────────────┐
│                                  │                         │
│ Video                            │ AI Assistant            │
│                                  │                         │
│ [ YouTube player ]               │ message                 │
│                                  │ message                 │
│ -------------------------------- │ message                 │
│                                  │                         │
│ Transcript                       │                         │
│                                  │                         │
│ 00:00 Lorem ipsum...             │                         │
│ 00:31 Lorem ipsum...             │                         │
│ 01:05 Lorem ipsum...             │                         │
│                                  │                         │
│                                  │ [ Ask something... ]    │
└──────────────────────────────────┴─────────────────────────┘
```

Desktop:

```text
65% content
35% chat
```

Mobile:

tabs:

```text
Video
Transcript
Chat
```

---

# 11. AI providers architecture

Do NOT couple the application directly to one provider.

Create an abstraction:

```ts
interface AIProvider {
  id: string

  chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<AIResponse>
}
```

Example:

```text
lib/
  ai/
    providers/
      openai.ts
      anthropic.ts
      gemini.ts
      groq.ts
      openai-compatible.ts
```

Provider factory:

```ts
getAIProvider(config)
```

Example configuration:

```ts
interface AIProviderConfig {
  provider:
    | "openai"
    | "anthropic"
    | "gemini"
    | "groq"
    | "openai-compatible"

  apiKey: string

  model: string

  baseUrl?: string
}
```

---

# 12. Supported chat providers

MVP:

```text
OpenAI
Anthropic
Google Gemini
Groq
OpenAI-compatible custom endpoint
```

The custom provider allows future support for services implementing an OpenAI-compatible API.

Do not hard-code model lists forever.

Provide default model suggestions, but allow:

```text
Custom model ID
```

---

# 13. Cursor clarification

Do not implement "Cursor" as a native AI provider unless an official inference API compatible with this architecture is available.

Cursor is primarily a development environment and should not automatically be treated as a generic LLM API provider.

Instead support:

```text
OpenAI-compatible/custom provider
```

with:

```text
Base URL
API Key
Model
```

This keeps the architecture extensible.

---

# 14. Speech-to-Text providers

Speech-to-text must have its own provider abstraction.

```ts
interface TranscriptionProvider {
  transcribe(
    file: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult>
}
```

Initial providers:

```text
OpenAI
Groq
```

Optional later:

```text
Gemini
local Whisper
faster-whisper
```

Example directory:

```text
lib/
  transcription/
    providers/
      openai.ts
      groq.ts

    chunker.ts
    merger.ts
    types.ts
```

---

# 15. Provider settings screen

Create:

```text
Settings
```

Sections:

```text
AI Chat Provider
Transcription Provider
YouTube Authentication
Appearance
Data
```

Example:

```text
Chat Provider

Provider:
[ OpenAI ▼ ]

API Key:
[ sk-************************ ]

Model:
[ model-name ▼ ]

[ Test Connection ]
```

Transcription:

```text
Transcription Provider

Provider:
[ Groq ▼ ]

API Key:
[ gsk_******************* ]

Model:
[ whisper-large-v3-turbo ▼ ]

[ Test Connection ]
```

---

# 16. API key handling

MVP requirement:

Keys can be stored locally in:

```text
localStorage
```

However clearly display:

```text
API keys are stored locally in this browser.
```

Never:

```text
console.log(apiKey)
send API keys to analytics
include them in exceptions
persist them server-side
commit them to .env
```

When a server route requires the key:

```text
browser
   ↓
request header/body
   ↓
Next.js route
   ↓
provider
```

The server uses it only for that request.

---

# 17. Local storage structure

Use one application namespace.

Example:

```ts
const STORAGE_KEY = "youtube-ai-transcriber"
```

Root:

```ts
interface AppState {
  version: number

  projects: VideoProject[]

  settings: AppSettings
}
```

Project:

```ts
interface VideoProject {
  id: string

  metadata: VideoMetadata

  transcript?: Transcript

  conversations: Conversation[]

  createdAt: string
  updatedAt: string
}
```

---

# 18. Conversation structure

```ts
interface Conversation {
  id: string
  title: string

  messages: ChatMessage[]

  createdAt: string
  updatedAt: string
}
```

Message:

```ts
interface ChatMessage {
  id: string

  role:
    | "user"
    | "assistant"

  content: string

  createdAt: string

  citations?: TranscriptCitation[]
}
```

---

# 19. Transcript citations

The AI should be encouraged to reference transcript timestamps.

Example:

```text
The instructor explains supervised learning at approximately
[12:31].

He later compares it with unsupervised learning around
[18:07].
```

Citation:

```ts
interface TranscriptCitation {
  start: number
  end?: number
  text?: string
}
```

Click citation:

```text
[12:31]
```

should seek the video.

---

# 20. Chat grounding

The assistant must answer based primarily on the transcript.

Base system prompt:

```text
You are an AI assistant helping the user understand a video.

Use the provided video transcript as your primary source of truth.

When possible:
- reference timestamps;
- explain concepts clearly;
- differentiate information contained in the video from your own general knowledge;
- say when something was not discussed in the video.

Never claim the video said something that is not present in the transcript.
```

---

# 21. Handling small transcripts

If transcript fits comfortably inside the model context:

```text
System prompt
+
Full transcript
+
Chat history
+
Current question
```

This is simplest and should be the MVP behavior.

---

# 22. Handling large transcripts

Do NOT always send the entire transcript.

Create a simple retrieval mechanism.

For MVP, avoid a vector database.

Use transcript chunks.

Example:

```ts
interface TranscriptChunk {
  id: string

  start: number
  end: number

  text: string
}
```

Chunk transcript into approximately:

```text
500-1200 tokens
```

with slight overlap.

---

# 23. Retrieval MVP

Because there is no database, implement lightweight retrieval.

Possible first version:

```text
user question
      ↓
keyword extraction
      ↓
score transcript chunks
      ↓
select top 5-10
      ↓
send selected context to model
```

Possible scoring:

```text
word overlap
keyword frequency
TF-IDF-like scoring
```

Avoid introducing embeddings in the first version.

Later add optional embeddings.

---

# 24. Better retrieval — Phase 2

Optional:

Generate embeddings for transcript chunks.

Store vectors in IndexedDB instead of localStorage because embeddings can become large.

Architecture:

```text
Transcript
 ↓
Chunks
 ↓
Embeddings
 ↓
IndexedDB
 ↓
Cosine similarity
 ↓
Top-K chunks
 ↓
LLM
```

This is NOT required for MVP.

---

# 25. Default chat actions

Above the message input add shortcuts:

```text
Summarize video

Explain simply

Create study notes

Main topics

Create quiz

Important timestamps
```

Possible prompts:

### Summarize video

```text
Create a structured summary of this video using the transcript.
```

### Study notes

```text
Transform the transcript into concise study notes organized by topic.
```

### Quiz

```text
Generate 10 questions about the video and provide the answers separately.
```

### Important timestamps

```text
Identify the most important parts of the video and return their timestamps.
```

---

# 26. Transcript features

User should be able to:

```text
Search transcript
Copy transcript
Download .txt
Download .md
Download .json
```

Optional:

```text
Download .srt
Download .vtt
```

---

# 27. Export Markdown

Example:

```md
# Video title

Channel: Example Channel
URL: https://youtube.com/...

## Transcript

### 00:00

Transcript...

### 02:37

Transcript...
```

---

# 28. History screen

Route:

```text
/library
```

Display previous videos.

Card:

```text
Thumbnail

Title
Channel

Duration
Date imported

[ Open ]
[ Delete ]
```

Search:

```text
Search videos...
```

Since everything is stored locally:

```text
No account
No authentication
No cloud synchronization
```

---

# 29. Suggested routes

```text
/
    Home / import URL

/video/[id]
    Main video workspace

/library
    Local transcription library

/settings
    Providers/settings
```

Server:

```text
/api/youtube/metadata

/api/youtube/subtitles

/api/transcription/start

/api/chat

/api/providers/test
```

---

# 30. Suggested project structure

```text
src/
│
├── app/
│   ├── page.tsx
│   │
│   ├── library/
│   │   └── page.tsx
│   │
│   ├── settings/
│   │   └── page.tsx
│   │
│   ├── video/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   └── api/
│       │
│       ├── youtube/
│       │   ├── metadata/
│       │   │   └── route.ts
│       │   │
│       │   └── subtitles/
│       │       └── route.ts
│       │
│       ├── transcription/
│       │   └── route.ts
│       │
│       ├── chat/
│       │   └── route.ts
│       │
│       └── providers/
│           └── test/
│               └── route.ts
│
├── components/
│   │
│   ├── video/
│   │   ├── youtube-player.tsx
│   │   ├── video-header.tsx
│   │   └── import-video.tsx
│   │
│   ├── transcript/
│   │   ├── transcript-view.tsx
│   │   ├── transcript-segment.tsx
│   │   ├── transcript-search.tsx
│   │   └── transcript-actions.tsx
│   │
│   ├── chat/
│   │   ├── chat-panel.tsx
│   │   ├── chat-message.tsx
│   │   ├── chat-input.tsx
│   │   └── suggested-actions.tsx
│   │
│   └── settings/
│       ├── provider-settings.tsx
│       └── youtube-settings.tsx
│
├── lib/
│   │
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── gemini.ts
│   │   │   ├── groq.ts
│   │   │   └── openai-compatible.ts
│   │   │
│   │   ├── provider-factory.ts
│   │   ├── context-builder.ts
│   │   ├── retrieval.ts
│   │   └── types.ts
│   │
│   ├── transcription/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   └── groq.ts
│   │   │
│   │   ├── chunk-audio.ts
│   │   ├── merge-transcripts.ts
│   │   └── types.ts
│   │
│   ├── youtube/
│   │   ├── downloader.ts
│   │   ├── metadata.ts
│   │   ├── subtitles.ts
│   │   └── url.ts
│   │
│   ├── storage/
│   │   ├── projects.ts
│   │   ├── settings.ts
│   │   └── migrations.ts
│   │
│   └── utils/
│       ├── time.ts
│       ├── ids.ts
│       └── errors.ts
│
└── types/
    ├── video.ts
    ├── transcript.ts
    ├── chat.ts
    └── settings.ts
```

---

# 31. State management

Avoid Redux.

Use:

```text
React Context
+
hooks
+
localStorage
```

or:

```text
Zustand + persist
```

Recommended:

```text
Zustand
```

because it makes local persistence easy.

Possible stores:

```text
useProjectStore
useSettingsStore
```

Do not create one enormous store.

---

# 32. Long-running transcription

A video may take several minutes to process.

The UI must expose progress.

States:

```ts
type TranscriptionStatus =
  | "idle"
  | "loading_metadata"
  | "checking_subtitles"
  | "downloading_audio"
  | "processing_audio"
  | "transcribing"
  | "merging"
  | "complete"
  | "error"
```

Progress UI:

```text
Preparing video...

Downloading audio...
████████░░ 80%

Transcribing...
Chunk 7 / 18

Building transcript...
```

---

# 33. API response errors

Standardize errors.

```ts
interface APIError {
  code: string
  message: string
  details?: string
}
```

Codes:

```text
INVALID_URL

VIDEO_NOT_FOUND

VIDEO_PRIVATE

AUTH_REQUIRED

INVALID_COOKIES

AUDIO_EXTRACTION_FAILED

TRANSCRIPTION_FAILED

PROVIDER_AUTH_FAILED

RATE_LIMITED

MODEL_NOT_FOUND

CONTEXT_TOO_LARGE
```

---

# 34. Privacy

The application should communicate:

```text
Transcripts and conversations are saved locally on this device.

Audio is temporarily processed by the application and sent to the transcription provider selected by the user.

AI requests are sent directly to the provider selected by the user through the application server.
```

Do not implement analytics for MVP.

---

# 35. Security

Validate YouTube URLs before sending anything to shell commands.

CRITICAL:

Never construct something such as:

```ts
exec(`yt-dlp ${userUrl}`)
```

because this creates command injection risk.

Use:

```ts
spawn(
  "yt-dlp",
  [/* validated arguments */],
  options
)
```

The URL must be validated against allowed YouTube domains.

Allowed hosts:

```text
youtube.com
www.youtube.com
m.youtube.com
youtu.be
music.youtube.com
```

Reject anything else.

---

# 36. Process execution

Create utility:

```text
runProcess()
```

using Node:

```ts
child_process.spawn
```

Requirements:

```text
timeout
stderr capture
exit code handling
process cleanup
```

Never execute shell commands through:

```text
shell: true
```

unless absolutely necessary.

---

# 37. Temp file management

Use a UUID:

```text
/tmp/youtube-ai/{uuid}/
```

Example:

```text
metadata.json
audio.mp3

chunks/
  chunk-000.mp3
  chunk-001.mp3
  chunk-002.mp3
```

Finally:

```ts
await rm(jobDirectory, {
  recursive: true,
  force: true
})
```

---

# 38. Streaming chat

AI chat should stream responses.

Desired experience:

```text
User:
Explain what he means at 13:20.

Assistant:
At approximately 13:20, the speaker...
```

Use the native streaming mechanism supported by each provider or normalize them to an application-level `ReadableStream`.

Provider interface can expose:

```ts
streamChat(...)
```

rather than only returning the final response.

---

# 39. AI context builder

Create:

```text
context-builder.ts
```

Responsibilities:

```text
receive user question
      ↓
identify relevant transcript sections
      ↓
format timestamps
      ↓
include recent conversation
      ↓
create provider-independent prompt
```

Format transcript context:

```text
[00:12:04 - 00:12:32]
The neural network receives...

[00:15:43 - 00:16:09]
During training...
```

This makes citations easier.

---

# 40. Provider independence

Application components must never contain:

```ts
if (provider === "openai")
```

Provider-specific behavior belongs exclusively under:

```text
lib/ai/providers/
```

Same principle for transcription.

This allows another provider to be added by creating one adapter.

---

# 41. Project import lifecycle

Final desired lifecycle:

```text
User pastes URL

        ↓

Validate URL

        ↓

Load metadata

        ↓

Create local project

        ↓

Check captions

        ↓

Caption available?
     /       \
   YES       NO
   ↓          ↓
Import     Download audio
caption        ↓
          Chunk audio
               ↓
          Transcribe
               ↓
          Merge segments
             /
            /
           ↓

Normalize transcript

        ↓

Save project to localStorage

        ↓

Open video workspace

        ↓

Enable AI chat
```

---

# 42. MVP requirements

The MVP is considered complete when the application can:

- [ ] Accept a YouTube URL.
- [ ] Validate the URL.
- [ ] Fetch video metadata.
- [ ] Display thumbnail/title/channel/duration.
- [ ] Extract existing subtitles when available.
- [ ] Download audio when subtitles do not exist.
- [ ] Split long audio.
- [ ] Transcribe using Groq.
- [ ] Transcribe using OpenAI.
- [ ] Merge transcript chunks.
- [ ] Preserve timestamps.
- [ ] Display transcript.
- [ ] Search transcript.
- [ ] Click timestamps to seek video.
- [ ] Save projects in localStorage.
- [ ] List previous videos.
- [ ] Delete previous videos.
- [ ] Configure provider API keys.
- [ ] Chat with OpenAI.
- [ ] Chat with Anthropic.
- [ ] Chat with Gemini.
- [ ] Chat with Groq.
- [ ] Support an OpenAI-compatible custom provider.
- [ ] Stream chat responses.
- [ ] Answer using transcript context.
- [ ] Reference transcript timestamps.
- [ ] Export TXT.
- [ ] Export Markdown.
- [ ] Handle processing errors cleanly.
- [ ] Clean temporary files.

---

# 43. Features explicitly outside MVP

Do NOT initially implement:

```text
Authentication/accounts
Cloud database
Cloud synchronization
Teams
Payments
Subscriptions
Vector database
Redis
Background workers
Queues
Docker microservices
Mobile application
Browser extension
Collaborative transcription
```

Keep the first version simple.

---

# 44. Recommended package philosophy

Prefer official SDKs where practical.

Avoid unnecessarily wrapping every feature in another dependency.

Possible dependencies:

```text
next
react
typescript
tailwindcss
shadcn/ui
lucide-react
zustand
zod
nanoid
```

Provider SDKs as necessary.

System dependencies:

```text
yt-dlp
ffmpeg
```

---

# 45. Validation

Use Zod for all external inputs.

Examples:

```text
YouTube URL
provider
model
messages
metadata
API configuration
```

Never trust browser data simply because the application generated it.

---

# 46. UI design direction

Visual style:

```text
minimal
modern
developer-tool inspired
desktop-first but responsive
low visual noise
```

Reference feeling:

```text
Linear
Vercel
ChatGPT
Cursor
```

But do not copy any application directly.

Use:

```text
neutral palette
rounded cards
subtle borders
small shadows
large content area
clear typography
```

Support:

```text
Light
Dark
System
```

---

# 47. Main navbar

```text
Logo

New transcription

Library

Settings
```

No complex sidebar is needed outside the video workspace.

---

# 48. Video workspace header

Example:

```text
← Library

How Neural Networks Actually Work

3Blue1Brown
18:42

[ Copy Transcript ] [ Export ]
```

---

# 49. Empty chat state

Display:

```text
Ask anything about this video.
```

Suggestions:

```text
Summarize this video

What are the main concepts?

Explain this like I'm a beginner

Create study notes

Create a quiz
```

---

# 50. Transcript search

Input:

```text
Search transcript...
```

Search results should:

```text
highlight matching text
show timestamp
scroll to segment
seek video when clicked
```

---

# 51. Large localStorage limitation

Do not store:

```text
video files
audio files
audio blobs
thumbnails as base64
```

Store only strings/metadata.

If transcript storage begins exceeding reasonable localStorage limits, implement a storage abstraction:

```ts
interface StorageAdapter {
  getProject(...)
  saveProject(...)
  deleteProject(...)
}
```

MVP:

```text
LocalStorageAdapter
```

Later:

```text
IndexedDBAdapter
CloudAdapter
```

This prevents storage implementation from leaking throughout the application.

---

# 52. Recommended implementation phases

## Phase 1 — Foundation

Implement:

```text
Next.js
TypeScript
Tailwind
shadcn
routing
layout
Zustand
types
localStorage
```

Do not implement AI yet.

---

## Phase 2 — YouTube

Implement:

```text
URL validation
metadata
yt-dlp wrapper
ffmpeg wrapper
temporary job directory
cleanup
```

Validate with several public videos.

---

## Phase 3 — Captions

Implement:

```text
subtitle detection
subtitle extraction
VTT parsing
segment normalization
```

Prefer captions before transcription.

---

## Phase 4 — Transcription

Implement:

```text
audio extraction
normalization
chunking
Groq adapter
OpenAI adapter
transcript merging
timestamps
progress
```

---

## Phase 5 — Workspace

Implement:

```text
video player
transcript
timestamp seeking
search
copy
exports
```

---

## Phase 6 — AI chat

Implement:

```text
provider interface
OpenAI
Anthropic
Gemini
Groq
custom OpenAI-compatible endpoint
streaming
```

---

## Phase 7 — Transcript grounding

Implement:

```text
transcript chunking
retrieval
context builder
timestamp citations
```

---

## Phase 8 — Private YouTube

Implement:

```text
cookies.txt upload
temporary cookies
authenticated yt-dlp
secure cleanup
authentication errors
```

Do this only after the public video workflow is stable.

---

## Phase 9 — Polish

Implement:

```text
dark mode
loading states
error states
responsive UI
provider testing
empty states
keyboard navigation
```

---

# 53. Development rules for Codex

Follow these rules during implementation:

1. Do not over-engineer.
2. Do not introduce a database.
3. Do not introduce authentication.
4. Do not introduce Redis.
5. Do not introduce queues in MVP.
6. Keep provider integrations isolated behind interfaces.
7. Keep YouTube handling isolated from UI code.
8. Keep transcription independent of chat.
9. Validate every API input.
10. Never expose API keys in logs.
11. Never persist uploaded YouTube cookies.
12. Never persist downloaded audio.
13. Always remove temporary files.
14. Never execute user input through shell interpolation.
15. Prefer captions before paid transcription.
16. Keep components small.
17. Use strict TypeScript.
18. Avoid `any`.
19. Add meaningful error handling.
20. Implement one functional phase before moving to the next.

---

# 54. Initial Codex implementation order

Start implementation exactly in this order:

```text
1. Initialize project architecture.
2. Define TypeScript domain models.
3. Implement localStorage abstraction.
4. Implement Zustand stores.
5. Implement URL validator.
6. Implement yt-dlp metadata endpoint.
7. Build homepage/import UI.
8. Create local project when video loads.
9. Build video workspace.
10. Integrate YouTube iframe player.
11. Implement caption extraction.
12. Implement ffmpeg audio processing.
13. Implement audio chunker.
14. Implement transcription abstraction.
15. Implement Groq transcription.
16. Implement OpenAI transcription.
17. Implement transcript merger.
18. Implement transcript UI.
19. Implement timestamp seeking.
20. Implement transcript search.
21. Implement provider configuration.
22. Implement AI provider abstraction.
23. Implement OpenAI chat.
24. Implement Anthropic chat.
25. Implement Gemini chat.
26. Implement Groq chat.
27. Implement custom OpenAI-compatible chat.
28. Implement streaming.
29. Implement transcript retrieval.
30. Implement grounded chat responses.
31. Implement timestamp citations.
32. Implement TXT/Markdown export.
33. Implement library/history.
34. Implement deletion.
35. Implement private-video cookie support.
36. Harden temporary file cleanup.
37. Improve error handling.
38. Polish responsive UI.
```

---

# 55. Acceptance scenario

The following scenario must work:

```text
User opens application.

User enters:
https://youtube.com/watch?v=example

Application displays video metadata.

User presses:
Transcribe.

Application searches for captions.

If captions are unavailable:
audio is downloaded,
split,
transcribed,
merged.

Transcript appears.

User clicks:
12:47

YouTube player jumps to 12:47.

User asks:

"What does the instructor explain about neural networks?"

Application retrieves relevant transcript segments.

AI responds:

"At approximately [12:47], the instructor explains..."

User clicks:
[12:47]

Player moves to that section.

User closes application.

User returns later.

Video, transcript and conversation are restored from localStorage.
```

---

# 56. Definition of done

The project is complete when the full workflow:

```text
YouTube URL
→ metadata
→ captions/audio
→ transcription
→ local persistence
→ transcript viewer
→ AI chat
→ timestamp citations
```

works reliably without requiring any database or user account.

Prioritize correctness and architecture clarity over adding features.