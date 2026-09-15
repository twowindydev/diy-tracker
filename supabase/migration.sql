-- DIY Tracker schema
-- Lives in its own "diy_tracker" schema inside the shared WatchTracker
-- Supabase project, alongside WatchTracker's own tables (public schema)
-- and SecondBrain's (secondbrain schema). Same pattern as SecondBrain —
-- keeps each app's tables properly separated rather than just
-- name-prefixed in public.
--
-- RLS is enabled below with no policies (default-deny for anon/
-- authenticated). All reads/writes go through Next.js server actions
-- using the service role key, which bypasses RLS entirely, gated by the
-- site PIN — so this is a safety net against accidental future exposure,
-- not something the app's own functionality depends on.

create extension if not exists "pgcrypto";

create schema if not exists diy_tracker;

create table if not exists diy_tracker.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  area text check (area in ('house', 'garden', 'other')) default 'other',
  status text not null check (status in ('todo', 'planning', 'started', 'completed', 'archived')) default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists diy_tracker.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references diy_tracker.jobs(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists diy_tracker.progress_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references diy_tracker.jobs(id) on delete cascade,
  note text not null,
  next_steps text,
  created_at timestamptz not null default now()
);

create table if not exists diy_tracker.materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references diy_tracker.jobs(id) on delete cascade,
  name text not null,
  quantity text,
  acquired boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on diy_tracker.jobs(status);
create index if not exists job_photos_job_id_idx on diy_tracker.job_photos(job_id);
create index if not exists progress_log_job_id_idx on diy_tracker.progress_log(job_id);
create index if not exists materials_job_id_idx on diy_tracker.materials(job_id);

-- Row Level Security: enabled with no policies, i.e. default-deny for
-- anon/authenticated roles. The service role (used exclusively by this
-- app's server actions) bypasses RLS entirely, so this has zero effect on
-- how the app works — it just closes off any accidental future exposure
-- via the anon key, and keeps Supabase's security linter quiet now that
-- diy_tracker is an exposed schema. If a genuine client-side/anon use case
-- shows up later, add specific policies then rather than removing this.
alter table diy_tracker.jobs enable row level security;
alter table diy_tracker.job_photos enable row level security;
alter table diy_tracker.progress_log enable row level security;
alter table diy_tracker.materials enable row level security;

-- Keep updated_at current on jobs
create or replace function diy_tracker.jobs_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_updated_at on diy_tracker.jobs;
create trigger jobs_updated_at
  before update on diy_tracker.jobs
  for each row execute function diy_tracker.jobs_set_updated_at();
