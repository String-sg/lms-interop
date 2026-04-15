import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db/client";
import { quizResponses } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const CreateSchema = z.object({
  moduleId: z.string().min(1),
  quizId: z.string().min(1).max(128),
  selected: z.number().int().nonnegative().max(32),
  correct: z.boolean(),
});

export async function GET(req: Request) {
  const userId = await requireUser();
  const url = new URL(req.url);
  const moduleId = url.searchParams.get("moduleId");
  if (!moduleId) return new NextResponse("moduleId required", { status: 400 });

  const db = getDb();
  // Most-recent attempt per quizId for this user+module. Dedup client-side
  // since Drizzle/pg-core doesn't have a portable DISTINCT ON helper here.
  const rows = await db
    .select()
    .from(quizResponses)
    .where(
      and(
        eq(quizResponses.userId, userId),
        eq(quizResponses.moduleId, moduleId),
      ),
    )
    .orderBy(desc(quizResponses.attemptedAt));

  const seen = new Set<string>();
  const latest = rows.filter((r) => {
    if (seen.has(r.quizId)) return false;
    seen.add(r.quizId);
    return true;
  });

  return NextResponse.json(latest);
}

export async function POST(req: Request) {
  const userId = await requireUser();
  let body: z.infer<typeof CreateSchema>;
  try {
    body = CreateSchema.parse(await req.json());
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const db = getDb();
    const id = nanoid();
    await db.insert(quizResponses).values({
      id,
      userId,
      moduleId: body.moduleId,
      quizId: body.quizId,
      selected: body.selected,
      correct: body.correct,
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/quiz-responses failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
