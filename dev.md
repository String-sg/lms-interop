# Development Notes & Design Decisions

## Architecture

### Why MDX, not plain Markdown?

MDX is a superset of Markdown that allows embedded React components (callouts, quizzes, video embeds) without sidecar JSON files. At the source level it's still diffable, exportable, and Obsidian-compatible — just avoid JSX syntax in modules you want to open in Obsidian directly.

Plain `.md` was considered but rejected because it can't embed interactive components without a separate config format. Full HTML/JSON was rejected for losing portability.

### Why Vercel Blob + Postgres, not just Postgres?

| Content | Where | Why |
|---|---|---|
| MDX module text | Postgres `text` column (future) or Blob | For MVP, Postgres is simpler. Blob adds CDN delivery + cheaper storage at scale. |
| Uploaded PDFs | Blob (private) | PDFs can be 100MB+. Postgres has row size limits and storing binary in it is painful. |
| Metadata, progress, notes | Postgres | Relational data with queries, joins, indexes. |

**Current state:** MDX stored in Blob, fetched by URL. Could simplify to a Postgres `text` column for MVP — one fewer service. PDFs always need Blob regardless.

### Why BlockNote for the WYSIWYG editor?

Course creators are non-technical. They can't edit raw Markdown. We evaluated:

- **TipTap + markdown serializer** — Rich Notion-like WYSIWYG. Widely used, but requires more setup for block-based UX.
- **Milkdown** — Natively markdown-first (perfect round-trips). Smaller ecosystem, less polished mobile UX.
- **BlockNote** (chosen) — Block-based Notion clone on top of TipTap. Nicest drag-and-drop UX for non-technical users. Heavier bundle but best creator experience. Has built-in mobile toolbar.

BlockNote serializes to Markdown via `blocksToMarkdownLossy()`. The "lossy" means some block-level formatting (like column layouts) may simplify, but standard content round-trips cleanly.

### Why [[wikilinks]] graph, not courses > modules?

We considered three structures:

1. **Flat modules with tags** — Simplest. Just a library you filter. No relationships.
2. **Courses > Modules** — Traditional LMS with enforced linear order and prerequisites.
3. **Graph/links like Obsidian** (chosen) — Modules link to each other with `[[wikilinks]]`. No enforced order. Learners explore by following links.

The graph model was chosen because:
- It matches the "Obsidian for learning" vision
- Learning isn't always linear — topics connect in webs
- Creators add links naturally in prose (`See also: [[React Hooks]]`)
- The graph view gives visual discovery that flat lists and rigid courses don't

Wikilinks are parsed on save, materialized into a `module_links` table (fromId → toSlug), and rendered as normal `<a>` links in the reader.

## Storage

### Neon Postgres (via Vercel Marketplace)

Tables:
- `modules` — id, slug, title, tags, mdxBlobUrl, frontmatter, createdBy, timestamps
- `module_links` — fromId → toSlug (materialized from wikilinks on every save)
- `progress` — userId + moduleId composite PK. Tracks completedAt, scrollPct, timeMs
- `notes` — Highlights and notes anchored by text offset range
- `uploads` — PDF upload tracking (status: pending → parsing → done/error)

Schema lives in `src/db/schema.ts`. Migrations via `drizzle-kit push`.

### Vercel Blob

- **Public files:** Published `.mdx` module content (served by URL from CDN)
- **Private files:** Uploaded PDFs (sent to Mistral OCR, never publicly accessible)

The `BLOB_READ_WRITE_TOKEN` is auto-provisioned by the Vercel Marketplace integration.

## Auth

### Clerk (via Vercel Marketplace)

Two roles managed via `publicMetadata.role`:
- `creator` — Access to `/studio/*`, can create/edit modules, import PDFs
- `learner` (default) — Read modules, track progress, take notes

Role gate is enforced in `proxy.ts` (Next.js 16 middleware). The `/studio/*` routes and `/api/modules`, `/api/ocr` endpoints require `role: "creator"`.

To make someone a creator: Clerk Dashboard → Users → select user → Public Metadata → `{ "role": "creator" }`.

## Learning Records

### What we track

| Signal | How | Endpoint |
|---|---|---|
| Scroll % | `IntersectionObserver` on scroll position | `/api/progress` |
| Active reading time | Timer that pauses on `visibilitychange` (tab hidden) | `/api/progress` |
| Mark complete | Tap FAB button | `/api/progress` |
| Highlights | Select text → save anchor (start/end offset + text) | `/api/notes` |
| Notes | Select text → write a note attached to that anchor | `/api/notes` |

### Flushing strategy

Progress (scroll + time) is flushed via `navigator.sendBeacon` every 15 seconds and on `beforeunload`/`pagehide`. This avoids blocking navigation and works even if the tab closes. The server merges: scroll % only goes up (high-water mark), time is additive, completedAt is write-once.

## Caching (Next.js 16 Cache Components)

`cacheComponents: true` is enabled in `next.config.ts`. This enables Partial Prerendering (PPR):

| Content | Strategy | Cache tag |
|---|---|---|
| Module reader shell (title, tags) | `use cache` + `cacheLife('hours')` | `module:{slug}` |
| Module list (home page) | `use cache` + `cacheLife('minutes')` | `modules-list` |
| Graph data | `use cache` + `cacheLife('minutes')` | `graph` |
| Per-user progress/notes | Dynamic inside `<Suspense>` | Never cached |

When a creator saves a module, `updateTag('module:{slug}')`, `updateTag('modules-list')`, and `updateTag('graph')` fire to invalidate stale data within the same request.

## PDF Import (optional, requires Mistral API key)

Flow: Upload PDF → store in Blob (private) → send URL to Mistral OCR (`mistral-ocr-latest`) → get markdown back → open in BlockNote editor for cleanup → save as module.

The OCR endpoint is at `/api/ocr`. Set `MISTRAL_API_KEY` in env to enable. Without it, everything else still works — you just can't import PDFs.

## Mobile-First UX

- Bottom nav bar: Library / Graph / Records / Studio
- Reader: scroll progress bar at top, "Mark complete" FAB at bottom-right
- Selection toolbar (highlight/note) floats at top when text is selected
- `viewport-fit: cover` + `safe-area-inset-bottom` padding for notched devices
- All touch targets ≥ 44px
- BlockNote uses its built-in mobile toolbar in full-screen mode

## Local Development

```bash
# Prerequisites: Neon, Blob, and Clerk provisioned via Vercel Marketplace

# Pull env vars
vercel env pull .env.local --yes

# Push DB schema
pnpm dlx dotenv-cli -e .env.local -- pnpm drizzle-kit push

# Set yourself as creator in Clerk Dashboard
# Users → your user → Public Metadata → { "role": "creator" }

# Run
pnpm dev
```

## Future Considerations

- **Simplify MDX storage** — Move from Blob URLs to a Postgres `text` column for MVP. Keeps Blob only for PDFs.
- **Search** — Full-text search on module content via Postgres `pg_trgm` or `tsvector`.
- **Spaced repetition** — Surface modules for review based on completion date + forgetting curve.
- **Export** — Download all modules as a zip of `.md` files (Obsidian vault compatible).
- **Collaborative editing** — Yjs/CRDT layer on BlockNote for real-time co-authoring.
- **Quiz components** — MDX `<Quiz>` component with answer tracking in the progress table.
