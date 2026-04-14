import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { progress } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const Schema = z.object({
  moduleId: z.string(),
  scrollPct: z.number().min(0).max(100).optional(),
  timeMsDelta: z.number().min(0).max(3_600_000).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: Request) {
  const userId = await requireUser();
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.moduleId, body.moduleId)))
    .limit(1);

  const now = new Date();
  const nextScroll = Math.max(existing?.scrollPct ?? 0, body.scrollPct ?? 0);
  const nextTime = (existing?.timeMs ?? 0) + (body.timeMsDelta ?? 0);
  const completedAt = body.completed
    ? (existing?.completedAt ?? now)
    : existing?.completedAt ?? null;

  if (existing) {
    await db
      .update(progress)
      .set({ scrollPct: nextScroll, timeMs: nextTime, completedAt, updatedAt: now })
      .where(and(eq(progress.userId, userId), eq(progress.moduleId, body.moduleId)));
  } else {
    await db.insert(progress).values({
      userId,
      moduleId: body.moduleId,
      scrollPct: nextScroll,
      timeMs: nextTime,
      completedAt,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}
