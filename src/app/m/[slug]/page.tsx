import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db/client";
import { modules, progress } from "@/db/schema";
import { fetchText } from "@/lib/blob";
import { RenderMdx } from "@/lib/mdx/render";
import { ReaderClient } from "@/components/reader/reader-client";
import { Badge } from "@/components/ui/badge";

async function getModuleBySlug(slug: string) {
  "use cache";
  cacheTag(`module:${slug}`);
  cacheLife("hours");
  const db = getDb();
  const [row] = await db.select().from(modules).where(eq(modules.slug, slug)).limit(1);
  if (!row) return null;
  const raw = await fetchText(row.mdxBlobUrl);
  return { row, raw };
}

async function Reader({ moduleId }: { moduleId: string }) {
  const { userId } = await auth();
  if (!userId) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.moduleId, moduleId)))
    .limit(1);
  return (
    <ReaderClient
      moduleId={moduleId}
      initialCompleted={!!row?.completedAt}
      initialScrollPct={row?.scrollPct ?? 0}
    />
  );
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getModuleBySlug(slug);
  if (!result) notFound();
  const { row, raw } = result;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{row.title}</h1>
        {row.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {row.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <RenderMdx source={raw} />

      <Suspense fallback={null}>
        <Reader moduleId={row.id} />
      </Suspense>
    </div>
  );
}
