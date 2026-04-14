import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db/client";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const CreateSchema = z.object({
  moduleId: z.string(),
  anchor: z.object({
    type: z.enum(["highlight", "note"]),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    text: z.string().max(4000),
  }),
  body: z.string().max(4000).default(""),
});

export async function GET(req: Request) {
  const userId = await requireUser();
  const url = new URL(req.url);
  const moduleId = url.searchParams.get("moduleId");
  if (!moduleId) return new NextResponse("moduleId required", { status: 400 });

  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.moduleId, moduleId)));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await requireUser();
  const parsed = CreateSchema.parse(await req.json());
  const db = getDb();
  const id = nanoid();
  await db.insert(notes).values({
    id,
    userId,
    moduleId: parsed.moduleId,
    anchor: parsed.anchor,
    body: parsed.body,
  });
  return NextResponse.json({ id });
}

export async function DELETE(req: Request) {
  const userId = await requireUser();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("id required", { status: 400 });
  const db = getDb();
  await db.delete(notes).where(and(eq(notes.userId, userId), eq(notes.id, id)));
  return NextResponse.json({ ok: true });
}
