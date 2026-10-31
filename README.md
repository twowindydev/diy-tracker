# DIY Tracker

Personal job-tracking app for things spotted around the house and garden.
Add a job as a to-do, move it through Planning → Started → Completed →
Archived, keep a progress log with next steps, track materials needed, and
attach photos. Includes a stripped-down "shopping list" view per job for
checking materials while out in a store.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind
- Supabase (Postgres + Storage) — living inside the existing **WatchTracker**
  Supabase project, in its own `diy_tracker` schema (same pattern as
  SecondBrain's `secondbrain` schema in that same project). Not a new
  project, so no extra project-level compute cost.
- Hosted on Vercel at `diy.2windy.uk`
- Single shared PIN gate (no per-user accounts) — see "Access" below

## One-time setup

### 1. Database

In the **WatchTracker** Supabase project's SQL Editor, run
`supabase/migration.sql`. It creates a `diy_tracker` schema and everything
lives inside that — it won't touch `public` (WatchTracker's own tables) or
`secondbrain`.

**Important — expose the schema:** by default Supabase's API (PostgREST)
only serves the `public` schema. Go to **Project Settings → API → Exposed
schemas** and add `diy_tracker` to the list, or every request from this
app will fail with a 404/406. This is the same step SecondBrain's setup
would have needed for its `secondbrain` schema.

### 2. Storage bucket

In the same WatchTracker project, create a **private** storage bucket named
`diy-tracker-photos` (or whatever you set `SUPABASE_STORAGE_BUCKET` to).
Storage buckets aren't schema-scoped, so this sits alongside whatever
WatchTracker/SecondBrain already use in Storage — just make sure the name
doesn't clash with an existing bucket. Private is deliberate — photos are
served via short-lived signed URLs generated server-side, not public URLs.

### 3. Environment variables

Copy `.env.example` to `.env.local` for local dev, and set the same values
in Vercel's project settings for production:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the
  **WatchTracker** Supabase project (anon key isn't actually used for
  table access here, but Supabase's client wants one)
- `SUPABASE_SERVICE_ROLE_KEY` — from the same project. **Server-only**,
  never exposed to the browser. This is what lets the app read/write
  without needing RLS policies on the new tables.
- `SUPABASE_STORAGE_BUCKET` — bucket name from step 2
- `SITE_PIN` — the PIN you'll type in on the login screen
- `SITE_SESSION_SECRET` — a long random string (e.g. `openssl rand -hex 32`),
  used to sign the session cookie

### 4. Deploy

Push to a new GitHub repo, import into Vercel, set the env vars above, and
point `diy.2windy.uk` at it the same way as the other `*.2windy.uk` apps.

## Access

There's no per-user login — just a single shared PIN (`SITE_PIN`) gating
the whole site via a signed cookie, since this is now reachable on the open
internet rather than just the home network. Anyone with the PIN and a
link can use it; there's no separate admin/read-only distinction.

## Notes on the data model

All tables live in the `diy_tracker` schema in the WatchTracker Supabase
project (not `public`):

- `jobs` — one row per job; `status` is one of `todo`, `planning`,
  `started`, `completed`, `archived`
- `job_photos` — photos live in Supabase Storage; this table just
  stores the storage path
- `progress_log` — free-form notes + optional "next steps", newest
  first
- `materials` — checkable materials list per job; the shopping-list
  view at `/jobs/[id]/shopping-list` is just this table filtered/rendered
  for a phone screen
- `quick_tasks` — small/cleaning jobs (e.g. "clean the oven") shown in the
  Quick tasks panel at the top of the dashboard; just a title, area and
  done flag — no statuses, photos, materials or progress log

## Regression test plan

Not included in this scaffold yet — to be built out as a maintained
artifact once the core flows are confirmed working end to end, per your
usual pattern.
