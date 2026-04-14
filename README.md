# Interop — Obsidian for learning

A mobile-first LMS where every module is markdown (.mdx), authored with a WYSIWYG
(BlockNote), linked via `[[wikilinks]]` into an Obsidian-style graph, with
completion, scroll-%, reading time, and highlight/note tracking per learner.

## Stack

- **Next.js 16** App Router + Cache Components (PPR)
- **Clerk** auth with roles (`creator` / `learner`, set via `publicMetadata.role`)
- **Neon Postgres** + Drizzle ORM
- **Vercel Blob** (public for `.mdx`, private for PDFs)
- **Mistral OCR** for PDF → markdown
- **BlockNote** WYSIWYG editor (serializes to markdown)
- **next-mdx-remote/rsc** + remark-gfm to render MDX
- **shadcn/ui** + Tailwind v4, mobile-first

## Setup

1. `cp .env.example .env.local` and fill in values.
2. Install via Vercel Marketplace (recommended):
   - Neon Postgres (provides `DATABASE_URL`)
   - Vercel Blob (provides `BLOB_READ_WRITE_TOKEN`)
   - Clerk (provides Clerk keys)
3. Run the migration:

   ```bash
   pnpm dlx dotenv-cli -e .env.local -- pnpm drizzle-kit push
   ```

4. Set one user's Clerk `publicMetadata.role` to `"creator"` (Clerk dashboard → Users).
5. Add `MISTRAL_API_KEY` (or route via AI Gateway with `AI_GATEWAY_API_KEY`).
6. `pnpm dev` → http://localhost:3000

## Routes

- `/` — Library
- `/m/[slug]` — Reader (progress tracking, mark-complete, highlights)
- `/graph` — Force-directed graph of modules & wikilinks
- `/records` — Completions, time spent, notes
- `/studio` — Creator-only module list
- `/studio/new` — Create module
- `/studio/[id]` — Edit module
- `/studio/import` — PDF → OCR → editor

## Key files

- `proxy.ts` — Clerk middleware + role gate
- `src/db/schema.ts` — Drizzle schema
- `src/lib/mdx/wikilinks.ts` — `[[link]]` extractor + transformer
- `src/lib/mdx/render.tsx` — MDX renderer
- `src/lib/ocr/mistral.ts` — PDF → markdown
- `src/app/api/modules/route.ts` — Save module (Blob write, wikilink parse, cache invalidate)
- `src/app/api/progress/route.ts` — sendBeacon target for scroll/time/completion
- `src/app/api/notes/route.ts` — Highlights + notes
- `src/components/editor/blocknote-editor.tsx` — WYSIWYG
- `src/components/reader/reader-client.tsx` — Scroll tracker, FAB, highlight toolbar

## Why MDX, not plain .md?

MDX exports/diffs like plain .md but enables embedded components (callouts,
quizzes, video) without sidecar JSON. Avoid MDX-only syntax in modules you want
to edit in Obsidian itself.
# lms-interop
