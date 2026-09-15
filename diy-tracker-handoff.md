# DIY Tracker — handoff

Personal job-tracking app for things spotted around the house and garden.
Built in a Claude.ai chat (Project: "DIY Tracker"); picking up here in
Cowork to finish setup and deployment.

## What it does

- Add a job as a to-do (title, description, house/garden/other, optional
  photos)
- Move it through: To do → Planning → Started → Completed → Archived
- Progress log per job: free-form notes + "next steps", newest first
- Materials-needed checklist per job
- A stripped-down `/jobs/[id]/shopping-list` view — phone-friendly,
  checkable materials list for use in-store
- Single shared PIN gate (no per-user accounts) — signed cookie, checked
  in middleware, since this will be reachable on the open internet

## Stack

Next.js 14 (App Router, TypeScript, Tailwind) + Supabase (Postgres +
Storage) + Vercel, matching the pattern of Andy's other `*.2windy.uk` apps.

## Where the code lives

The scaffolded project was delivered as a zip and merged into:
`E:\2windy Dev\Claude Projects\DIY Tracker\` (flattened — no nested
`diy-tracker` folder). Not yet pushed to git or deployed to Vercel.

## Database — already done

- **Not a new Supabase project.** Lives inside the existing **WatchTracker**
  Supabase project, in its own `diy_tracker` schema — same pattern as
  SecondBrain's `secondbrain` schema in that same project. Avoids the
  extra per-project compute cost a new project would add.
- Migration (`supabase/migration.sql` in the repo) has been **run** —
  schema created with tables `jobs`, `job_photos`, `progress_log`,
  `materials`.
- `diy_tracker` has been added to **Project Settings → API → Exposed
  schemas** and confirmed working (4 of 4 schemas now exposed:
  `diy_tracker`, `graphql_public`, `public`, `secondbrain`).
- **RLS is enabled** on all four tables, with no policies (default-deny
  for anon/authenticated). The app only ever uses the service-role key
  server-side, which bypasses RLS, so this is a safety net rather than
  something the app depends on.
- Noticed in passing: "Automatically expose new tables" is toggled ON in
  that Data API settings screen. Supabase recommends leaving it off so
  new tables aren't API-exposed by default. Not urgent, just flagged.

## Still to do

1. **Storage bucket**: create a **private** bucket named
   `diy-tracker-photos` in the WatchTracker Supabase project (Storage
   section). Photos are served via short-lived signed URLs generated
   server-side, not public URLs.
2. **Env vars**: copy `.env.example` → `.env.local`, fill in from the
   WatchTracker project's Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose client-side)
   - `SUPABASE_STORAGE_BUCKET=diy-tracker-photos`
   - `SITE_PIN` (whatever PIN Andy wants)
   - `SITE_SESSION_SECRET` (long random string, e.g. `openssl rand -hex 32`)
3. **Local test**: `npm install`, `npm run dev`, confirm the PIN gate,
   job creation, photo upload, status changes, materials, and the
   shopping-list view all work end to end against the real Supabase
   project.
4. **Git + deploy**: push to a new GitHub repo (pattern:
   `twowindydev/<repo-name>`), import into Vercel, set the same env vars
   there, point `diy.2windy.uk` at it via Cloudflare DNS (same CNAME
   pattern as the other `*.2windy.uk` apps).
5. **Regression test plan**: not built yet. Per Andy's standing
   preference, build this as a maintained artifact once the core flows
   are confirmed working — same pattern as WatchTracker's test plan.

## Known/accepted issues (already handled, just documented)

- Next.js pinned to `14.2.35`. There's a critical AVIF RCE
  (GHSA-2xp9-vwfh-vxw4) with no patched release on the 14.x line —
  mitigated by setting `images.unoptimized: true` in `next.config.js`,
  which makes the vulnerable code path unreachable (this app doesn't need
  on-the-fly image resizing anyway).
- `npm audit` still flags an old `postcss` version bundled *inside*
  Next's own internals (not the top-level postcss, which is current).
  Build-time only, no untrusted input reaches it in this app — left
  as-is rather than forcing a Next 16 upgrade, but Andy's call if he
  wants to revisit later.

## Design notes (if extending the UI)

Workshop/hardware-store palette, not the generic AI-page defaults: warm
paper background (`#EFEAE0`), charcoal ink (`#2B2E2C`), amber for
"planning" (`#D9A441`), denim for "started" (`#3E5C76`), moss for
"completed" (`#5A7052`). Space Grotesk (sans, self-hosted via
`@fontsource`) for UI text, IBM Plex Mono for status labels/metadata.
Flat bordered "job ticket" cards with a small coloured corner tag per
status — deliberately not rounded-corner soft-shadow SaaS cards.
