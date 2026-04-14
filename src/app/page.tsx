import Link from "next/link";
import { Suspense } from "react";
import { cacheTag, cacheLife } from "next/cache";
import { getDb } from "@/db/client";
import { modules, progress } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

async function getRecentModules() {
  "use cache";
  cacheTag("modules-list");
  cacheLife("minutes");
  const db = getDb();
  return db
    .select({ id: modules.id, slug: modules.slug, title: modules.title, tags: modules.tags, updatedAt: modules.updatedAt })
    .from(modules)
    .orderBy(desc(modules.updatedAt))
    .limit(50);
}

async function ProgressPill({ userId, moduleId }: { userId: string; moduleId: string }) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(progress)
    .where(eq(progress.moduleId, moduleId));
  if (!row || row.userId !== userId) return null;
  if (row.completedAt) return <Badge variant="secondary">Completed</Badge>;
  if (row.scrollPct > 0) return <Badge variant="outline">{row.scrollPct}%</Badge>;
  return null;
}

async function UserProgressList() {
  const { userId } = await auth();
  if (!userId) return null;
  const mods = await getRecentModules();
  return (
    <ul className="grid gap-3">
      {mods.map((m) => (
        <li key={m.id}>
          <Link href={`/m/${m.slug}`}>
            <Card className="p-4 flex items-center justify-between gap-4 hover:bg-accent/40 transition-colors">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.title}</div>
                {m.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Suspense fallback={null}>
                <ProgressPill userId={userId} moduleId={m.id} />
              </Suspense>
            </Card>
          </Link>
        </li>
      ))}
      {mods.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No modules yet. Head to <Link className="underline" href="/studio">Studio</Link> to create one.
        </Card>
      )}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">Everything in, everything out as markdown.</p>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        }
      >
        <UserProgressList />
      </Suspense>
    </div>
  );
}
