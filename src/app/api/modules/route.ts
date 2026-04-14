import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { eq } from "drizzle-orm";
import matter from "gray-matter";
import { revalidateTag } from "next/cache";
import { getDb } from "@/db/client";
import { modules, moduleLinks } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { putMdx } from "@/lib/blob";
import { extractWikilinks } from "@/lib/mdx/wikilinks";
import { requireUser, isCreator } from "@/lib/auth";

const CreateSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  markdown: z.string(),
});

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(modules);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!(await isCreator())) return new NextResponse("Forbidden", { status: 403 });

  let body: z.infer<typeof CreateSchema>;
  try {
    body = CreateSchema.parse(await req.json());
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const db = getDb();

    const { data: fm } = matter(body.markdown);
    const mergedFm = { title: body.title, tags: body.tags, ...fm, updatedAt: new Date().toISOString() };
    const fmBlock = `---\n${Object.entries(mergedFm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n")}\n---\n\n`;
    const fullMdx = fmBlock + matter(body.markdown).content;

    const slug = slugify(body.title);
    const blobUrl = await putMdx(slug, fullMdx);

    const id = body.id ?? nanoid();

    await db
      .insert(modules)
      .values({
        id,
        slug,
        title: body.title,
        tags: body.tags,
        mdxBlobUrl: blobUrl,
        frontmatter: mergedFm,
        createdBy: userId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: modules.id,
        set: {
          slug,
          title: body.title,
          tags: body.tags,
          mdxBlobUrl: blobUrl,
          frontmatter: mergedFm,
          updatedAt: new Date(),
        },
      });

    // Replace wikilinks for this module
    await db.delete(moduleLinks).where(eq(moduleLinks.fromId, id));
    const links = extractWikilinks(body.markdown);
    if (links.length > 0) {
      await db
        .insert(moduleLinks)
        .values(links.map((l) => ({ fromId: id, toSlug: l.slug, label: l.label })));
    }

    revalidateTag("modules-list", "max");
    revalidateTag(`module:${slug}`, "max");
    revalidateTag("graph", "max");

    return NextResponse.json({ id, slug, mdxBlobUrl: blobUrl });
  } catch (err) {
    console.error("POST /api/modules failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
