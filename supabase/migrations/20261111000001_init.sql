-- Runeterra Journal schema
-- Apply with:  supabase db push   (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- Regions: public, read-only lore content
-- ---------------------------------------------------------------------------
create table if not exists public.regions (
  id            text primary key,
  name          text not null,
  epithet       text not null,
  tagline       text not null,
  icon          text not null,
  accent_from   text not null,
  accent_to     text not null,
  capital       text not null,
  governance    text not null,
  magic_stance  text not null,
  champions     text[] not null default '{}',
  featured      boolean not null default false,
  sections      jsonb not null default '[]'::jsonb,  -- [{id,title,paragraphs[],quote?}]
  sort_order    int not null default 0,
  updated_at    timestamptz not null default now()
);

alter table public.regions enable row level security;

drop policy if exists "Regions are readable by everyone" on public.regions;
create policy "Regions are readable by everyone"
  on public.regions for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: edit lore from the dashboard or with the service role.

-- ---------------------------------------------------------------------------
-- Tales: each user's saved storyteller conversations
-- ---------------------------------------------------------------------------
create table if not exists public.tales (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  region_id   text references public.regions (id) on delete set null,
  title       text not null default 'Untitled tale',
  messages    jsonb not null default '[]'::jsonb,   -- [{role, content, at}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tales_user_updated_idx on public.tales (user_id, updated_at desc);

alter table public.tales enable row level security;

drop policy if exists "Users manage their own tales" on public.tales;
create policy "Users manage their own tales"
  on public.tales for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Storyteller usage log (written only by the Edge Function's service role)
-- ---------------------------------------------------------------------------
create table if not exists public.storyteller_usage (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  model          text not null,
  input_tokens   int not null default 0,
  output_tokens  int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists storyteller_usage_user_time_idx on public.storyteller_usage (user_id, created_at desc);

alter table public.storyteller_usage enable row level security;
-- No policies: clients cannot read or write this table; the service role bypasses RLS.
