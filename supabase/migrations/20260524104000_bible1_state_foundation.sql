-- bible1 Supabase state foundation
-- Apply manually to the David-owned `bible1` Supabase project after review.
-- The app uses server-side service-role route handlers; no anonymous table policies are opened here.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.service_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Service',
  raw_input text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_plans_slug_shape check (slug ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$')
);

create table if not exists public.service_plan_items (
  id uuid primary key default gen_random_uuid(),
  service_plan_id uuid not null references public.service_plans(id) on delete cascade,
  position integer not null,
  book_slug text not null,
  chapter integer not null check (chapter > 0),
  start_verse integer check (start_verse is null or start_verse > 0),
  end_verse integer check (end_verse is null or end_verse > 0),
  label text not null,
  href text not null,
  raw_ref text not null,
  created_at timestamptz not null default now(),
  constraint service_plan_items_position_nonnegative check (position >= 0),
  constraint service_plan_items_range_order check (
    end_verse is null or start_verse is null or end_verse >= start_verse
  )
);

create unique index if not exists service_plan_items_plan_position_idx
  on public.service_plan_items(service_plan_id, position);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  current_href text not null,
  reference text not null,
  book_slug text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  ordinal integer not null check (ordinal > 0),
  number integer not null check (number > 0),
  text text not null,
  blackout boolean not null default false,
  service_plan_id uuid references public.service_plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_sessions_slug_shape check (slug ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$')
);

create trigger service_plans_set_updated_at
before update on public.service_plans
for each row execute function public.set_updated_at();

create trigger live_sessions_set_updated_at
before update on public.live_sessions
for each row execute function public.set_updated_at();

alter table public.service_plans enable row level security;
alter table public.service_plan_items enable row level security;
alter table public.live_sessions enable row level security;

comment on table public.service_plans is 'Mutable worship-service reference plans for bible1. Access through server-side route handlers.';
comment on table public.service_plan_items is 'Parsed references within a service plan, ordered for live operators.';
comment on table public.live_sessions is 'Current cross-device projection state for a live worship session.';
