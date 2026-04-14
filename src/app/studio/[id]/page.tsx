import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { modules } from "@/db/schema";
import { isCreator } from "@/lib/auth";
import { fetchText } from "@/lib/blob";
import { parseFrontmatter } from "@/lib/mdx/render";
import { ModuleEditor } from "@/components/editor/module-editor";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isCreator())) redirect("/");
  const { id } = await params;
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
