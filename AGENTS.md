<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product overview

LeetTrack is a single Next.js 16.2.4 app (App Router, Turbopack) that serves as a LeetCode accountability dashboard. All pages are client-rendered (`"use client"`). No custom API routes — data fetching is client-side to Supabase and an external LeetCode proxy API.

### Running the app

- **Dev server:** `npm run dev` (port 3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint 9)
- Node.js is managed via nvm at `/home/ubuntu/.nvm`. Source it before running commands: `export NVM_DIR="/home/ubuntu/.nvm" && . "$NVM_DIR/nvm.sh"`

### Environment variables

The app requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```
Without valid Supabase credentials the app still starts and renders pages, but auth/data calls will fail with "Failed to fetch" errors.

### Key caveats

- The `src/lib/supabase.ts` module throws at import time if the env vars are completely missing (not just invalid). A `.env.local` with placeholder values avoids build/startup crashes.
- The external LeetCode API (`https://alfa-leetcode-api.onrender.com`) is hardcoded in `src/lib/leetcode.ts`. No local mock exists.
- ESLint currently reports 1 error and 4 warnings in existing code (lint exit code 1). This is pre-existing and not caused by agent changes.
- No test framework is configured in the repo (no Jest/Vitest/Playwright). Only lint and build can be verified programmatically.
