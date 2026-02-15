# API, Prompts, and Logging Audit

This document inventories:
- Backend API endpoints (defined and currently used)
- External AI API calls
- Prompt templates used by AI features
- Logging behavior (server + client)

## 1) Runtime Architecture (Active App)

Primary runtime path:
- `server/index.ts` starts Express, installs middleware/logging, registers routes, serves client.
- `client/src/main.tsx` mounts React app.
- `client/src/App.tsx` defines routes/pages.

The root app is a monolith:
- Browser UI in `client/`
- API + DB persistence in `server/`
- Shared DB schema in `shared/`

## 2) Backend Endpoints (Defined)

From `server/routes.ts`:

- `GET /api/progress/:sessionId`
- `POST /api/progress`
- `GET /api/flashcards/:sessionId`
- `POST /api/flashcards`
- `GET /api/units`
- `GET /api/units/:unitId`
- `POST /api/units`
- `GET /api/problems/:sessionId`
- `POST /api/problems`
- `PATCH /api/problems/:id`

## 3) Backend Endpoints (Observed Client Usage)

Direct fetch usage in `client/src` currently:

- `GET /api/units/:unitId`
  - Used in `client/src/pages/UnitPage.tsx`
  - Purpose: load AI-generated unit from DB if not present in hardcoded data or Zustand store.

- `POST /api/units`
  - Used in `client/src/pages/TrackPage.tsx`
  - Purpose: persist AI-generated unit after successful generation/parsing.

Also present:
- Generic request wrappers in `client/src/lib/queryClient.ts` (`apiRequest`, `getQueryFn`) for future/optional use.

## 4) External AI API Calls

### Gemini (Google Generative AI SDK)

Used in:
- `client/src/lib/ai.ts`
- `client/src/components/chatbot/useChatbot.ts`
- `client/src/lib/ai-visualization/useAIVisualization.ts`

Core method patterns:
- `model.generateContent(...)`
- `model.startChat(...).sendMessage(...)`

Configured models in `client/src/lib/config.ts`:
- `gemini-3-flash-preview`
- `gemini-3-pro-preview`
- `gemini-3-pro-image-preview`

### Groq (OpenAI-compatible REST)

Used in:
- `client/src/lib/ai.ts`

Endpoint:
- `POST https://api.groq.com/openai/v1/chat/completions`

Configured model:
- `llama-3.3-70b-versatile`

## 5) Prompt Inventory

### A) Unit Generation Prompt
- File: `client/src/pages/TrackPage.tsx`
- Purpose: generate complete DSA unit JSON (lesson, toy example, parsons blocks, flashcards, tests, visualization steps).
- Special constraints: real LeetCode grounding, strict JSON-only output, structural requirements for blanks/testHarness.

### B) Lesson Hint Prompt
- File: `client/src/components/features/LessonView.tsx`
- Prompt type: short explanatory rephrase prompt for current slide context.

### C) Visualization Regeneration Prompt
- File: `client/src/components/visualizations/UniversalVisualizer.tsx`
- Prompt type: generate new visualization steps JSON array for current algorithm.

### D) Chatbot Prompts
- File: `client/src/components/chatbot/useChatbot.ts`
- Includes:
  - Dynamic tutoring system prompt (problem, blocks, tests, failed tests, error context).
  - Image-prompt generation prompt before image model call.
  - "Generate new similar Faded Parsons problem" strict JSON prompt.

Quick-action user prompts:
- File: `client/src/components/chatbot/ChatbotPanel.tsx`
- Actions:
  - hint
  - explain
  - help with error
  - new problem
  - visualize

### E) AI Visualizer 2-Stage Prompts
- File: `client/src/lib/ai-visualization/prompts.ts`
- Stage 1: tool selector system prompt + user prompt template.
- Stage 2: main AI system prompt + user prompt template.
- Expected output: JSON with `content`, `toolCalls`, and `cardData`.

## 6) Logging Inventory

### A) Server Logging
- File: `server/index.ts`
- Behavior:
  - Logs all `/api/*` requests with method, path, status, duration.
  - Captures and logs JSON response body when `res.json(...)` is used.
  - Example shape: `GET /api/units/abc 200 in 12ms :: {...}`

### B) Client AI Call Logging (Persistent)
- File: `client/src/lib/ai.ts`
- LocalStorage key: `api_logs`
- Max entries: 100
- Fields:
  - `timestamp`
  - `provider`
  - `model`
  - `promptLength`
  - `responseLength`
  - `success`
  - `error`
  - `durationMs`
- Utility exports:
  - `getAPILogs()`
  - `clearAPILogs()`

### C) Console Debug Logs

Notable files with debug/error logs:
- `client/src/pages/TrackPage.tsx` (generation + parse diagnostics)
- `client/src/components/chatbot/useChatbot.ts` (chat errors, image generation, new problem parsing)
- `client/src/lib/ai-visualization/useAIVisualization.ts` (model calls, parse fallbacks)
- `client/src/lib/pyodide.ts` (execution traces/results)
- `client/src/components/features/ParsonsProblem.tsx` (assembled code + test execution errors)
- `client/src/pages/UnitPage.tsx` (unit fetch errors)

## 7) Data Persistence Flow (What Persists Where)

- Browser local persistence:
  - App state via Zustand persist (`client/src/lib/store.ts`)
  - AI request logs via `localStorage['api_logs']` (`client/src/lib/ai.ts`)

- Server/DB persistence:
  - Generated units saved through `POST /api/units` into `generated_units`
  - Other endpoint tables exist and are ready (`user_progress`, `flashcard_states`, `tracked_problems`)
  - DB schema: `shared/schema.ts`
  - DB operations: `server/storage.ts`
