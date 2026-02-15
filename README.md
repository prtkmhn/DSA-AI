# DSA-AI

DSA-AI is a full-stack TypeScript app for learning DSA with lessons, Parsons problems, flashcards, and AI-generated units.

## Stack
- Frontend: React + Vite + Tailwind
- Backend: Express (serverless on Vercel)
- DB: PostgreSQL (Drizzle + `pg`)
- AI: Gemini (primary) + Groq (optional fallback)

## Local Setup (Windows)
1. Install deps:
```bash
npm.cmd install
```
2. Create `.env` from `.env.example` and set:
- `DATABASE_URL`
- `NODE_ENV=development`
- `PORT=5000`
3. Push schema:
```bash
npm.cmd run db:push
```
4. Start dev server:
```bash
npm.cmd run dev
```
5. Open `http://localhost:5000`

## Vercel Deployment
Project is configured via `vercel.json`.

Use these settings in Vercel:
- Framework Preset: `Vite`
- Root Directory: `./`
- Build Command: `vite build`
- Output Directory: `dist/public`

Environment variable required:
- `DATABASE_URL` (Postgres connection string, usually from Neon)

After first deploy, run migrations once against production DB:
```bash
npm.cmd run db:push
```

## AI Keys
AI keys are entered in the app Settings page and stored client-side.

Required for generation:
- Gemini key (primary), or
- Groq key (fallback)

Recommended:
- Add both keys and enable fallback.

## Common Errors

### `All providers failed` / `429` / `quota`
Your provider hit quota/rate limits.

Fix:
1. Wait and retry.
2. Add billing/upgrade quota.
3. Add Groq key in Settings and use fallback.

Note: Google error payload may mention other model names (for quota dimensions) even when your app is configured for Gemini 3.

### `DATABASE_URL environment variable is required`
Set `DATABASE_URL` in Vercel project settings and redeploy.

### API works locally but fails on Vercel
Usually missing DB env var or migrations not applied. Re-check `DATABASE_URL` and run `db:push`.

## Security
- `.env` is ignored.
- Do not commit API keys.
- If a key was exposed, rotate it immediately.
