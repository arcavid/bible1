-- bible1 canonical corpus information architecture
-- Apply manually to the David-owned `bible1` Supabase project after review.
-- This migration intentionally does not open anonymous write policies.
-- Static generated corpus files remain the low-latency projection delivery snapshot;
-- these tables are the canonical relational model and seed target.

create extension if not exists pgcrypto;

create table if not exists public.bible_translations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_code text not null default 'ko',
  name_ko text not null,
  name_en text,
  abbreviation text not null,
  source_name text,
  source_license_note text,
  source_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bible_translations_code_shape check (code ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  constraint bible_translations_status check (status in ('active', 'draft', 'archived'))
);

create table if not exists public.bible_books (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.bible_translations(id) on delete cascade,
  book_order integer not null check (book_order between 1 and 66),
  slug text not null,
  osis_code text,
  korean_name text not null,
  abbreviation text not null,
  testament text not null,
  chapter_count integer not null check (chapter_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (translation_id, book_order),
  unique (translation_id, slug),
  constraint bible_books_slug_shape check (slug ~ '^[0-9A-Za-z][0-9A-Za-z]*$'),
  constraint bible_books_testament check (testament in ('old', 'new'))
);

create table if not exists public.bible_book_aliases (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.bible_books(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  alias_kind text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (book_id, normalized_alias),
  constraint bible_book_aliases_kind check (alias_kind in ('korean', 'abbreviation', 'english', 'legacy', 'manual'))
);

create index if not exists bible_book_aliases_lookup_idx
  on public.bible_book_aliases(normalized_alias);

create table if not exists public.bible_chapters (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.bible_translations(id) on delete cascade,
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter_number integer not null check (chapter_number > 0),
  verse_count integer not null check (verse_count > 0),
  source_hash text not null,
  anomalies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, chapter_number)
);

create index if not exists bible_chapters_translation_book_idx
  on public.bible_chapters(translation_id, book_id, chapter_number);

create table if not exists public.bible_verses (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.bible_translations(id) on delete cascade,
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter_id uuid not null references public.bible_chapters(id) on delete cascade,
  chapter_number integer not null check (chapter_number > 0),
  ordinal integer not null check (ordinal > 0),
  verse_number integer not null check (verse_number > 0),
  text text not null,
  text_nfc text not null,
  source_line_hash text not null,
  anomaly_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, ordinal),
  unique (translation_id, book_id, chapter_number, ordinal)
);

create index if not exists bible_verses_reference_idx
  on public.bible_verses(translation_id, book_id, chapter_number, ordinal);

create index if not exists bible_verses_display_reference_idx
  on public.bible_verses(translation_id, book_id, chapter_number, verse_number);

create table if not exists public.corpus_releases (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.bible_translations(id) on delete cascade,
  release_slug text not null,
  source_repo text,
  source_commit_sha text,
  source_manifest_sha256 text not null,
  generated_manifest_sha256 text not null,
  total_books integer not null check (total_books = 66),
  total_chapters integer not null check (total_chapters = 1189),
  total_verses integer not null check (total_verses > 0),
  anomaly_count integer not null default 0,
  status text not null default 'draft',
  validation_report jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (translation_id, release_slug),
  constraint corpus_releases_status check (status in ('draft', 'published', 'superseded', 'failed'))
);

alter table public.service_plan_items
  add column if not exists translation_code text not null default 'krv',
  add column if not exists translation_id uuid references public.bible_translations(id),
  add column if not exists book_id uuid references public.bible_books(id),
  add column if not exists chapter_id uuid references public.bible_chapters(id),
  add column if not exists start_verse_id uuid references public.bible_verses(id),
  add column if not exists end_verse_id uuid references public.bible_verses(id),
  add column if not exists parsed_range jsonb not null default '{}'::jsonb,
  add column if not exists validation_status text not null default 'valid';

alter table public.service_plan_items
  drop constraint if exists service_plan_items_validation_status;

alter table public.service_plan_items
  add constraint service_plan_items_validation_status
  check (validation_status in ('valid', 'ambiguous', 'invalid', 'unresolved'));

create index if not exists service_plan_items_start_verse_idx
  on public.service_plan_items(start_verse_id);

create index if not exists service_plan_items_end_verse_idx
  on public.service_plan_items(end_verse_id);

alter table public.live_sessions
  add column if not exists translation_code text not null default 'krv',
  add column if not exists translation_id uuid references public.bible_translations(id),
  add column if not exists current_verse_id uuid references public.bible_verses(id),
  add column if not exists preview_verse_id uuid references public.bible_verses(id),
  add column if not exists current_text_snapshot text,
  add column if not exists state_version bigint not null default 0,
  add column if not exists presenter_client_id text,
  add column if not exists last_heartbeat_at timestamptz;

create index if not exists live_sessions_current_verse_idx
  on public.live_sessions(current_verse_id);

create index if not exists live_sessions_preview_verse_idx
  on public.live_sessions(preview_verse_id);

drop trigger if exists bible_translations_set_updated_at on public.bible_translations;
create trigger bible_translations_set_updated_at
before update on public.bible_translations
for each row execute function public.set_updated_at();

drop trigger if exists bible_books_set_updated_at on public.bible_books;
create trigger bible_books_set_updated_at
before update on public.bible_books
for each row execute function public.set_updated_at();

drop trigger if exists bible_chapters_set_updated_at on public.bible_chapters;
create trigger bible_chapters_set_updated_at
before update on public.bible_chapters
for each row execute function public.set_updated_at();

drop trigger if exists bible_verses_set_updated_at on public.bible_verses;
create trigger bible_verses_set_updated_at
before update on public.bible_verses
for each row execute function public.set_updated_at();

drop trigger if exists corpus_releases_set_updated_at on public.corpus_releases;
create trigger corpus_releases_set_updated_at
before update on public.corpus_releases
for each row execute function public.set_updated_at();

alter table public.bible_translations enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_book_aliases enable row level security;
alter table public.bible_chapters enable row level security;
alter table public.bible_verses enable row level security;
alter table public.corpus_releases enable row level security;

comment on table public.bible_translations is 'Canonical Bible translation/corpus identities for bible1; currently seeded with one Korean corpus.';
comment on table public.bible_books is 'Canonical Bible books for each bible1 corpus translation.';
comment on table public.bible_book_aliases is 'Search and reference parser aliases linked to canonical books.';
comment on table public.bible_chapters is 'Canonical Bible chapters with generated source hashes and anomaly metadata.';
comment on table public.bible_verses is 'Canonical Bible verses. ordinal is navigation order; verse_number is displayed/source number.';
comment on table public.corpus_releases is 'Validated corpus seed/import releases tied to generated app snapshots.';
comment on column public.service_plan_items.start_verse_id is 'Nullable FK to canonical first verse in the planned passage. Null while DB corpus is unseeded or a chapter-only item.';
comment on column public.service_plan_items.end_verse_id is 'Nullable FK to canonical final verse in the planned passage. Null for chapter-only or unresolved ranges.';
comment on column public.live_sessions.current_verse_id is 'Nullable FK to canonical live verse. current_text_snapshot preserves display resilience.';
