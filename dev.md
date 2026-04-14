# Dev Log

## Bugs

### 2024-04-14: POST /api/modules returns 500 on production

**Symptom:** Saving a module from the studio UI fails with a 500 error on production.

**Root cause:** `src/app/api/modules/route.ts` used `updateTag()` from `next/cache` to invalidate cache tags after saving a module. In Next.js 16, `updateTag` can only be called from Server Actions — calling it from a Route Handler throws a runtime error. The handler also had no try-catch, so the thrown error surfaced as an unhandled 500 with no useful error message.

**Fix:** Replaced `updateTag` with `revalidateTag` (the correct API for Route Handlers in Next.js 16), using the required two-argument form `revalidateTag(tag, "max")`. Also added try-catch error handling to return proper 400/500 responses.

**Lesson:** In Next.js 16, cache invalidation APIs are context-sensitive:
- `updateTag` — Server Actions only (read-your-own-writes)
- `revalidateTag` — Server Actions and Route Handlers (stale-while-revalidate with `"max"` profile)

Always check `node_modules/next/dist/docs/` for the current API before using `next/cache` functions.
