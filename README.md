# bible1

Open-source code for **bible1**, a Korean-first Bible presentation app for church worship, Scripture reading, and live projector operation.

Production demo: <https://www.bible1.app/>

## Public repository boundary

This repository is intentionally **code-only**.

It does **not** include Bible verse text, generated chapter JSON, corpus seed files, or any repository history from non-public development. Deployments must read Bible content from an authorized corpus source configured by the deployer.

Why this boundary exists:

- Bible translation text is a separate rights/provenance problem from application code.
- This public repository starts from a clean, public-safe initial commit.

## What is included

- Next.js App Router application code
- Korean-first worship/presenter UI
- Keyboard-first command/search flow
- Projector/live-screen components
- Supabase schema for service plans, live sessions, and corpus tables
- Public-safe setup docs and environment variable shape

## What is not included

- Full KRV/개역한글 verse text
- `chapters/` or `data/chapters/` source corpus files
- generated chapter JSON / manifest lock files
- non-public release reviews or maintainer runbooks
- production secrets or database credentials

## Corpus / Bible text

See [`CORPUS.md`](CORPUS.md).

Short version: the app code is open source, but no license in this repository grants rights to any Bible translation text. Bring your own authorized corpus/database if you deploy your own instance.

## Development

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For routes that display Scripture text, configure a Supabase project with the schema in `supabase/migrations/` and provide your own authorized corpus data.

Environment shape:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe public values. `SUPABASE_SERVICE_ROLE_KEY`, if used for server-side maintenance/import tasks, must never be exposed to the browser.

## License

Application code is licensed under the MIT License. Bible translation text is not included and is not licensed by this repository.
