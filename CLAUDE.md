# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run digest          # Run the digest CLI (requires .env)
npm run auth            # Interactive OAuth flow to get refresh token
npm run lint            # Biome check
npm run format          # Biome format
npx tsc --noEmit        # Type check
```

All scripts use Node 24+ native `--env-file=.env` flag (no dotenv).

## Architecture

Gmail newsletter digest CLI: fetches emails by label → AI summarization → sends digest email → trashes processed.

```
src/
├── index.ts           # CLI orchestrator
├── config.ts          # Zod-validated env config
├── gmail/             # Gmail API: client, fetch, parse, cleanup
├── digest/            # AI: model setup, summarize, compose email
├── send.ts            # Send digest via Gmail API
└── state.ts           # Track processed email IDs

scripts/
└── auth.ts            # One-time OAuth flow
```

**Key dependencies:**
- `googleapis` - Gmail API
- `ai` + `@ai-sdk/anthropic` - Vercel AI SDK (supports anthropic/openai/google)
- `zod` - config validation

**Config flow:** `loadConfig()` in `config.ts` validates env vars and ensures selected AI provider has corresponding API key.

## Code Style

- ESM (`"type": "module"`)
- TypeScript strict mode, ES2024 target
- Biome for linting/formatting (2-space indent)
- Use `.js` extensions in imports (required for NodeNext)

## Commits

Follow [Conventional Commits](https://conventionalcommits.org): `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
