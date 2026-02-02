# Gmail Digest App - Implementation Plan

## Overview

Local CLI app that reads Gmail newsletters, generates AI-powered digest, emails summary to self, and cleans up processed emails.

## Decisions

- **Filtering**: Gmail label → optional sender whitelist → Claude summarization
- **Output**: Email digest sent to self
- **Scheduling**: Stateless CLI (`npm run digest`) - cloud-deployable
- **Cleanup**: Move to trash (recoverable 30 days)

## Tech Stack

- TypeScript + Node.js (ESM)
- `googleapis` - Gmail API
- `ai` + `@ai-sdk/anthropic` (or `@ai-sdk/openai`, etc.) - Vercel AI SDK for LLM abstraction
- `zod` - config validation
- `tsx` - dev runner

## Project Structure

```
olaf-email-digest/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config.ts             # Env vars + validation
│   ├── gmail/
│   │   ├── client.ts         # OAuth2 client setup
│   │   ├── fetch.ts          # Fetch emails by label
│   │   ├── parse.ts          # Extract email content
│   │   └── cleanup.ts        # Trash processed emails
│   ├── digest/
│   │   ├── summarize.ts      # Claude API calls
│   │   └── compose.ts        # Build digest email body
│   ├── send.ts               # Send via Gmail API
│   └── state.ts              # Track processed email IDs
├── scripts/
│   └── auth.ts               # One-time OAuth flow
├── config/
│   └── senders.json          # Optional sender whitelist
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

```bash
# Gmail OAuth2
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# LLM Provider (Vercel AI SDK - pick one)
AI_PROVIDER=anthropic          # anthropic | openai | google | etc.
ANTHROPIC_API_KEY=             # if using anthropic
OPENAI_API_KEY=                # if using openai
GOOGLE_GENERATIVE_AI_API_KEY=  # if using google

# App config
GMAIL_LABEL=Newsletters        # Label to process
DIGEST_RECIPIENT=me            # "me" = authenticated user
STATE_FILE=./state.json        # Processed email tracking
SENDER_WHITELIST=./config/senders.json  # Optional
```

## Implementation Phases

### Phase 1: Project Setup

1. Init npm project with TypeScript (ESM)
2. Install deps: `googleapis`, `ai`, `@ai-sdk/anthropic`, `zod`, `dotenv`, `tsx`
3. Configure `tsconfig.json`, `.env.example`
4. Create `config.ts` with zod validation

### Phase 2: Gmail OAuth Setup

1. Create `scripts/auth.ts` - interactive OAuth flow
2. Outputs refresh token to console/file
3. Document Google Cloud project setup in README

### Phase 3: Gmail Integration

1. `gmail/client.ts` - create authenticated client from refresh token
2. `gmail/fetch.ts` - list messages by label, batch fetch full content
3. `gmail/parse.ts` - extract subject, from, date, body (handle HTML/plain)
4. `gmail/cleanup.ts` - move message IDs to trash

### Phase 4: Digest Generation

1. `digest/model.ts` - configure AI SDK provider based on env (anthropic/openai/google)
2. `digest/summarize.ts` - use `generateText()` from AI SDK, get summary + key links
3. `digest/compose.ts` - format all summaries into HTML email body
4. User implements: summarization prompt (meaningful trade-offs here)

### Phase 5: Send & State

1. `send.ts` - send digest via Gmail API (`messages.send`)
2. `state.ts` - load/save processed IDs to avoid reprocessing

### Phase 6: CLI Entry Point

1. `index.ts` - orchestrate full flow:
   - Load config
   - Fetch emails
   - Filter by whitelist (if configured)
   - Summarize each
   - Compose & send digest
   - Trash processed
   - Update state

## Google Cloud Setup

1. Create project at console.cloud.google.com
2. Enable Gmail API
3. Configure OAuth consent screen (internal/testing)
4. Create OAuth2 credentials (Desktop app)
5. Download credentials, set CLIENT_ID/SECRET
6. Run `npm run auth` to get refresh token

## Verification

1. `npm run auth` - completes OAuth, outputs refresh token
2. `npm run digest` with test label - processes emails, sends digest
3. Check inbox for digest email
4. Check Gmail trash for processed emails

## Additional Decisions

- **Batch size**: No limit - process all matching emails daily
- **Image-only emails**: Skip + keep in inbox for manual review
- **Digest subject**: "Email Digest - {date}" (e.g., "Email Digest - Jan 15, 2026")
