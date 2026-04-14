# Test Plan & Coverage Gaps

## Current State

**No tests exist yet.** This document tracks what should be tested, priority, and gaps.

## Test Tooling (not yet installed)

| Tool | Purpose |
|---|---|
| Vitest | Unit + integration tests (fast, Vite-native) |
| Playwright | E2E browser tests |
| MSW | API mocking for integration tests |

## Unit Tests — High Priority

These are pure functions with no dependencies. Highest value, lowest effort.

### `src/lib/mdx/wikilinks.ts`

| Test case | Status |
|---|---|
| `extractWikilinks("See [[React Hooks]]")` → `[{ slug: "react-hooks", label: "React Hooks" }]` | ❌ Not written |
| `extractWikilinks("[[Target\|Custom Label]]")` → `[{ slug: "target", label: "Custom Label" }]` | ❌ Not written |
| Deduplication: `"[[A]] and [[A]]"` → 1 result | ❌ Not written |
| No wikilinks: `"plain text"` → `[]` | ❌ Not written |
| `wikilinksToMarkdownLinks("[[React Hooks]]")` → `"[React Hooks](/m/react-hooks)"` | ❌ Not written |
| `wikilinksToMarkdownLinks("[[Target\|Label]]")` → `"[Label](/m/target)"` | ❌ Not written |

### `src/lib/slug.ts`

| Test case | Status |
|---|---|
| `slugify("React Hooks")` → `"react-hooks"` | ❌ Not written |
| Special chars: `slugify("What's New?")` → `"whats-new"` | ❌ Not written |
| Long input truncated to 80 chars | ❌ Not written |
| Empty/whitespace → `"untitled"` | ❌ Not written |
| Multiple spaces/hyphens collapsed | ❌ Not written |

### `src/lib/mdx/render.tsx` — `parseFrontmatter()`

| Test case | Status |
|---|---|
| Extracts YAML frontmatter and returns body | ❌ Not written |
| No frontmatter → empty object + full body | ❌ Not written |
| Frontmatter with title, tags, custom fields | ❌ Not written |

## Integration Tests — Medium Priority

These test API routes with a real or mocked database.

### `POST /api/modules`

| Test case | Status |
|---|---|
| Creates module, returns id + slug | ❌ Not written |
| Extracts wikilinks and inserts into `module_links` | ❌ Not written |
| Updates existing module on conflict (same id) | ❌ Not written |
| Rejects non-creator users (403) | ❌ Not written |
| Rejects unauthenticated requests | ❌ Not written |

### `POST /api/progress`

| Test case | Status |
|---|---|
| Creates new progress row | ❌ Not written |
| Scroll % uses high-water mark (never decreases) | ❌ Not written |
| Time is additive (accumulates across flushes) | ❌ Not written |
| `completed: true` sets `completedAt` once (idempotent) | ❌ Not written |
| Rejects unauthenticated requests | ❌ Not written |

### `POST /api/notes`

| Test case | Status |
|---|---|
| Creates highlight with anchor | ❌ Not written |
| Creates note with body | ❌ Not written |
| `GET` returns only current user's notes for module | ❌ Not written |
| `DELETE` removes note | ❌ Not written |

### `POST /api/ocr`

| Test case | Status |
|---|---|
| Rejects non-PDF files | ❌ Not written |
| Rejects non-creator users | ❌ Not written |
| Returns markdown from Mistral OCR (mock) | ❌ Not written |

## E2E Tests — Lower Priority (Playwright)

| Flow | Status |
|---|---|
| Sign in → see empty Library | ❌ Not written |
| Creator: Studio → New → type title + content → Save → appears in Library | ❌ Not written |
| Creator: Studio → Import PDF → see parsed markdown in editor → Save | ❌ Not written |
| Learner: Open module → scroll to bottom → scroll % updates | ❌ Not written |
| Learner: Tap Mark Complete → Records shows "Done" | ❌ Not written |
| Learner: Select text → Highlight → note appears in sidebar | ❌ Not written |
| Graph: Create 2 modules with `[[wikilink]]` between them → Graph shows edge | ❌ Not written |
| Mobile: Bottom nav navigates correctly, FAB is tappable | ❌ Not written |

## Gaps & Risks

### No test infrastructure at all
Vitest and Playwright are not installed. No CI pipeline runs tests. This is the biggest gap.

### Auth boundary not tested
The `proxy.ts` role gate (creator vs learner) is untested. A misconfiguration could expose Studio to all users or lock everyone out.

### Cache invalidation not tested
When a module is saved, `updateTag()` should bust the cached module reader and graph. No test verifies stale data is actually purged.

### Progress merge logic is subtle
The high-water scroll %, additive time, and idempotent completion logic in `POST /api/progress` has edge cases (race conditions from multiple tabs, `sendBeacon` ordering). No test covers this.

### Wikilink edge cases
- Nested brackets: `[[a [[b]] c]]`
- Empty brackets: `[[]]`
- Very long titles exceeding slug truncation
- Unicode/emoji in module titles

### BlockNote round-trip fidelity
`blocksToMarkdownLossy()` is lossy by design. No test verifies which formatting survives the editor → markdown → MDX render round-trip. Tables, code blocks, and nested lists are most at risk.

## Recommended Priority Order

1. **Install Vitest** — `pnpm add -D vitest @vitejs/plugin-react`
2. **Unit tests** for `slugify`, `extractWikilinks`, `wikilinksToMarkdownLinks`, `parseFrontmatter`
3. **API integration tests** for `/api/modules` and `/api/progress` (with test DB or mocks)
4. **Install Playwright** — `pnpm add -D @playwright/test`
5. **E2E: Creator flow** — create module → appears in library → reader renders
6. **E2E: Learner flow** — read → scroll → complete → records
7. **CI pipeline** — run unit + E2E on PR via GitHub Actions
