# Channel Data Revealer

A research and packaging toolkit for building a faceless YouTube channel: channel/competitor analysis, title generation, thumbnail strategy, story mapping, and fact verification for scripts.

This project was originally built with [Lovable](https://lovable.dev).

## Important: set up your API keys before using this

Nothing in this app works well without keys. Copy `.env.example` to `.env` and fill in:

- `YOUTUBE_API_KEY` — a YouTube Data API v3 key, for channel/video analysis.
- `GEMINI_API_KEY` (or `OPENAI_API_KEY`) — for AI-assisted titles, thumbnails, story maps, and **fact verification**.

Without an AI key, every feature still runs, but returns an honest "not analyzed / needs research" result instead of a guess — it will never invent facts, sources, or scores. See "How fact verification works" below.

Alternatively, each user can paste their own keys into the app's API Settings modal — those are stored only in that browser's local storage and sent only to this app's own server.

## How fact verification works

Claims are checked with a real, two-step process:
1. **Research** — the claim is researched with live web search (Gemini's search grounding, or an OpenAI search-enabled model).
2. **Structure** — the findings are converted into the app's report format, using *only* the sources actually found in step 1.

A server-side check then confirms every cited source in the final report matches a real search result. Anything that doesn't match is automatically downgraded to "Needs research / Low confidence" rather than trusted. This means:
- With no AI key: every claim is returned as "Needs research", never a guess.
- With a key: claims are checked against the live web, not the model's memory.
- Either way, this is a strong first pass — always check anything load-bearing to your script against a primary source yourself before publishing.

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
cp .env.example .env   # then fill in your keys
npm run dev
```

- `npm run build` — production build
- `npm run test` — run the test suite (vitest)
- `npm run lint` — lint

## Architecture notes

- `src/lib/server-config.ts` — central place API keys are resolved from (user-supplied, then server env). Never add a `VITE_`-prefixed env var here or anywhere else — Vite inlines those into the client bundle.
- `src/lib/ai-client.server.ts` — shared "prompt in, JSON out" client for Gemini/OpenAI, including sending real images for vision analysis.
- `src/lib/fact-grounding.server.ts` — the grounded fact-verification engine described above.
- Every `*.functions.ts` file exports `createServerFn` handlers; these run server-side only and are the only place API keys should ever be read or used.
- When a feature has no AI key (or the AI call fails), its fallback should describe what's missing rather than inventing plausible-looking content. Search for "Not analyzed" / "Needs research" / "Not returned by the AI" to see the pattern used throughout.
