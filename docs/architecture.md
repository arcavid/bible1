# bible1 architecture

bible1 is a Next.js App Router worship-projection app.

## Public code / authorized corpus split

The public repository contains app code and database schema. It intentionally does not contain full Bible verse text. Deployments that display Scripture must provide an authorized corpus through Supabase or another maintainer-approved corpus pipeline.

## Core surfaces

- `/` — Korean-first command/search entry point.
- `/[book]/[chapter]` — chapter grid/operator recovery surface.
- `/[book]/[chapter]/[verse]` — presenter surface.
- `/[book]/[chapter]/[verse]/live` — clean audience/projector surface.
- `/read/[book]/[chapter]` — reading surface.
- `/service/[id]` — service plan workspace.

## Data model

The Supabase migrations define tables for:

- `bible_translations`
- `bible_books`
- `bible_book_aliases`
- `bible_chapters`
- `bible_verses`
- `corpus_releases`
- `service_plans`
- `service_plan_items`
- `live_sessions`

The schema is public. Corpus rows are supplied separately by the deployer.
