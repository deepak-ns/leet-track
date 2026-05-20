# Requirements for Rewriting the App while Keeping Same Data/Auth

Purpose: This document lists everything the new application must have or be configured with so it can reuse the exact same database, authentication, and user data as the current app.

ASSUMPTIONS
- The project uses Supabase for Postgres + Auth (see `src/shared/lib/supabase/client.ts`).
- The new app will point to the same Supabase project (or the same Postgres DB + same Auth provider configuration).

1) Environment variables (minimum)
- `NEXT_PUBLIC_SUPABASE_URL` — public Supabase URL (copy from current `.env.local`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public/anon key (copy from current `.env.local`).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key for server-side privileged DB operations (required for server-side jobs/migrations).
- `DATABASE_URL` (optional) — direct Postgres connection string if you connect to the DB directly rather than via Supabase client.
- `NEXTAUTH_SECRET` / `SESSION_SECRET` — secret for session/JWT signing if using NextAuth or custom sessions.
- OAuth provider client IDs/secrets used by the Supabase Auth settings (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.) — keep identical in the new app's deployment if you host provider config outside Supabase.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — email delivery settings for signup, magic links, password reset.
- `SENTRY_DSN`, `VERCEL_*`, analytics keys, and other third-party integration keys used by the app.
- Storage/Blob credentials if not using Supabase storage directly (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`).

2) Supabase project-level items to reuse (do NOT change unless planned and tested)
- Supabase Project URL and keys (`NEXT_PUBLIC_SUPABASE_URL`, anon key, service-role key).
- Auth settings and providers: OAuth client registrations and redirect URIs inside the Supabase project.
- Supabase Auth templates and SMTP configuration (so emails keep sending as before).
- Row Level Security (RLS) policies, Postgres functions, triggers, and scheduled jobs (cron) defined in Supabase.
- Stored views and materialized views (e.g. `user_dashboard_stats` appears to be used as a view in the app).
- Supabase Storage buckets and objects if your app stores files (ensure bucket names and ACLs match).
- Database roles, permissions, and custom JWT claims if used.

3) Database schema: required tables/views and important columns
- `profiles` — required columns used: `id`, `name`, `leetcode_username`, `daily_target`.
- `friends` — columns used: `user_id`, `friend_user_id`, `friend_id` (upsert/delete used on these columns).
- `daily_stats` — columns used: `user_id`, `leetcode_username`, `daily_target`, `stat_date`, possibly `date`, `total_solved`, `solved_today`.
- `solved_problems` — columns used: `user_id`, `problem_title`, `problem_slug`, `problem_difficulty`, `solved_date`, `created_at`.
- `user_dashboard_stats` — referenced as a read-only aggregation/view for dashboard queries.
- Any other application-specific tables referenced by code (search for `.from("<table>")` in the repo and confirm): e.g., `daily_stats`, `friends`, `profiles`, `solved_problems`, `user_dashboard_stats`.

4) Auth details to preserve
- Supabase Auth users (do not re-create or replace the user table) — the new app must use the same Supabase Auth project.
- JWT signing keys or secrets: ensure the same signing secret is used if you implement your own session verification.
- Refresh token/session persistence settings — make sure server-side libraries use the same expectations (token expiry, refresh flow).
- Social/OAuth client IDs and redirect URIs — these must remain registered with providers and in Supabase.

5) Policies, permissions, and RLS
- Export and re-apply all RLS policies or ensure the new app relies on the existing policies in the Supabase project.
- If you add server-side service access, use `SUPABASE_SERVICE_ROLE_KEY` for privileged operations, not the anon key (do not leak service key in client code).

6) Migrations and schema migrations
- Export the current DB schema and migrations from Supabase (or use the Supabase CLI):
  - `supabase db dump` (or use `pg_dump`) to get a full dump.
  - Export `migrations/` folder if using Supabase Migrations or a migration tool (e.g., Prisma, Flyway).
- Keep migration history so new deployments can run migrations safely without altering existing data unexpectedly.

7) Indexes, constraints, extensions
- Export indexes and constraints (unique keys, foreign keys) — the app expects those for performance and correctness.
- Note any Postgres extensions used (pgcrypto, citext, pg_trgm, etc.) and enable them in the target DB.

8) Storage & file assets
- If files are stored in Supabase Storage buckets, preserve bucket names and object keys.
- Ensure public/private access settings and signed URL behavior are replicated.

9) Background jobs, scheduled functions, and workers
- Identify any server-side scheduled tasks, cron jobs, or Supabase Edge Functions used by the app (e.g., nightly sync jobs).
- Preserve service account keys and workers that write to the database (or re-implement using the `SUPABASE_SERVICE_ROLE_KEY`).

10) External APIs and integrations
- `LEETCODE_API_BASE_URL` — this project calls an external LeetCode API at `https://alfa-leetcode-api.onrender.com` (ensure the new app can reach it and preserve any API keys or rate limits).
- Any analytics, error-reporting, payment, or notification providers configured in the current project.

11) Secrets and access control
- Do not commit `SUPABASE_SERVICE_ROLE_KEY` or any secret keys to client code or public repos.
- Store secrets in the target deployment's secret store (Vercel/Netlify/Heroku env vars, or cloud secret manager).

12) Backups and rollback plan (must do before switching)
- Take a full DB dump (pg_dump) and export Supabase Auth users and settings.
- Export Supabase storage objects (if any) and functions.
- Create a rollback checklist and verification scripts.

13) Tests to run after wiring the new app to the same DB/Auth
- Sign-up and sign-in flows (magic link/OAuth/social login/password reset).
- Session persistence and refresh token flows.
- Read/write flows for `profiles`, `friends`, `daily_stats`, `solved_problems` (create/update/delete operations).
- Dashboard and aggregation views (e.g., `user_dashboard_stats`).
- File upload/download flows if storage used.
- Background jobs that produce data visible in the UI.

14) Practical checklist (copy these values from the current project)
- Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `./.env.local`.
- Obtain and store `SUPABASE_SERVICE_ROLE_KEY` from Supabase UI (project settings > API).
- Export DB dump and migration files.
- Export RLS policies and SQL functions/triggers.
- Confirm OAuth redirect URIs and provider client secrets in Supabase Auth settings.
- Confirm SMTP/email provider settings used by Supabase.
- Confirm storage bucket names and policy settings.

15) Helpful commands / suggestions
- Supabase CLI (recommended):
  - `supabase login`
  - `supabase db dump --file dump.sql`
  - `supabase projects list` and inspect the project settings in the Supabase dashboard.
- PostgreSQL: `pg_dump --format=custom --file=prod.dump "$DATABASE_URL"` to take a full backup.

16) Notes specific to this repo
- The app currently expects only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (public keys). A server-side implementation will need the `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` for privileged operations.
- The repo queries the following tables/views (search results): `profiles`, `friends`, `daily_stats`, `solved_problems`, `user_dashboard_stats`.

If you want, I can:
- produce a one-file checklist in a compact JSON format for the new app to consume, or
- enumerate exactly how to export Supabase policies, functions, and migrations step-by-step.

---
Generated on: 2026-05-20
