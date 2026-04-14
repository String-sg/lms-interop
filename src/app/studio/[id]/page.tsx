import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { modules } from "@/db/schema";
import { isCreator } from "@/lib/auth";
import { fetchText } from "@/lib/blob";
import { parseFrontmatter } from "@/lib/mdx/render";
import { ModuleEditor } from "@/components/editor/module-editor";
import { Skeleton } from "@/components/ui/skeleton";

async function EditContent({ id }: { id: string }) {
  if (!(await isCreator())) redirect("/");
  const db = getDb();
  const [row] = await db.select().from(modules).where(eq(modules.id, id)).limit(1);
  if (!row) notFound();

  const raw = await fetchText(row.mdxBlobUrl);
  const { body } = parseFrontmatter(raw);

  return (
    <ModuleEditor
      id={row.id}
      initial={{ title: row.title, tags: row.tags, markdown: body }}
    />
  );
}

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4"><Skeleton className="h-96 w-full" /></div>}>
      <EditContent id={id} />
    </Suspense>
  );
}
