# Gmail Digest App - Implementation Plan

## Overview

Local CLI app that reads Gmail newsletters, generates AI-powered digest, emails summary to self, and cleans up processed emails.

## Decisions

- **Multi-account**: Support multiple Gmail accounts, same Google Cloud project
- **Filtering**: Gmail label (same across accounts) → optional sender whitelist → Claude summarization
- **Output**: Single digest email grouped by account, sent to primary account
- **Scheduling**: Stateless CLI (`npm run digest`) - cloud-deployable
- **Cleanup**: Move to trash (recoverable 30 days)

## Tech Stack

- TypeScript + Node.js 24+ (ESM)
- `googleapis` - Gmail API
- `ai` + `@ai-sdk/anthropic` (or `@ai-sdk/openai`, etc.) - Vercel AI SDK for LLM abstraction
- `zod` - config validation
- `tsx` - dev runner
- `@biomejs/biome` - linting & formatting

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
├── biome.json
└── README.md
```

## Environment Variables

```bash
# Gmail OAuth2 (shared across accounts)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=

# Gmail Accounts (comma-separated names)
GMAIL_ACCOUNTS=personal,work
GMAIL_REFRESH_TOKEN_PERSONAL=  # per-account refresh tokens
GMAIL_REFRESH_TOKEN_WORK=

# LLM Provider (Vercel AI SDK - pick one)
AI_PROVIDER=anthropic          # anthropic | openai | google | etc.
ANTHROPIC_API_KEY=             # if using anthropic
OPENAI_API_KEY=                # if using openai
GOOGLE_GENERATIVE_AI_API_KEY=  # if using google

# App config
GMAIL_LABEL=Newsletters        # Label to process (same across accounts)
DIGEST_RECIPIENT=me            # "me" = first account
STATE_FILE=./state.json        # Processed email tracking
SENDER_WHITELIST=./config/senders.json  # Optional
```

## Implementation Phases

### Phase 1: Project Setup ✅

- [x] Init npm project
- [x] Configure package.json (ESM, scripts, Node 24+ `--env-file`)
- [x] Install dependencies (googleapis, ai, @ai-sdk/anthropic, zod, tsx, biome)
- [x] Configure tsconfig.json
- [x] Configure biome.json
- [x] Create .env.example
- [x] Create src/config.ts (Zod validation)

### Phase 2: Gmail OAuth Setup ✅

- [x] Create `scripts/auth.ts` - interactive OAuth flow
- [x] Local callback server, outputs refresh token
- [ ] Add `--account` flag to auth script (e.g., `npm run auth -- --account=personal`)
- [ ] Document Google Cloud project setup in README

### Phase 3: Gmail Integration

- [ ] `gmail/client.ts` - create authenticated client per account
- [ ] `gmail/fetch.ts` - list messages by label, batch fetch, tag with account name
- [ ] `gmail/parse.ts` - extract subject, from, date, body (handle HTML/plain)
- [ ] `gmail/cleanup.ts` - move message IDs to trash (per account)

### Phase 4: Digest Generation

- [ ] `digest/model.ts` - configure AI SDK provider based on env
- [ ] `digest/summarize.ts` - use `generateText()` from AI SDK
- [ ] `digest/compose.ts` - format summaries grouped by account into HTML email

### Phase 5: Send & State

- [ ] `send.ts` - send digest via Gmail API (first account)
- [ ] `state.ts` - load/save processed IDs namespaced by account

### Phase 6: CLI Entry Point

- [ ] `index.ts` - orchestrate full flow:
  - Load config (all accounts)
  - Fetch emails from each account
  - Filter by whitelist (if configured)
  - Summarize each
  - Compose digest (grouped by account)
  - Send via first account
  - Trash processed (per account)
  - Update state (per account)

## Google Cloud Setup

1. Create project at console.cloud.google.com
2. Enable Gmail API
3. Configure OAuth consent screen (internal/testing)
4. Create OAuth2 credentials (Desktop app)
5. Download credentials, set CLIENT_ID/SECRET
6. Run `npm run auth` to get refresh token

## Verification

1. `npm run auth -- --account=personal` - completes OAuth for each account
2. `npm run digest` with test label - processes emails from all accounts
3. Check first account inbox for digest email (grouped by account)
4. Check Gmail trash in each account for processed emails

## Additional Decisions

- **Batch size**: No limit - process all matching emails daily
- **Image-only emails**: Skip + keep in inbox for manual review
- **Digest subject**: "Email Digest - {date}" (e.g., "Email Digest - Jan 15, 2026")
