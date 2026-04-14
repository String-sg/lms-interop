import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { modules, progress, notes } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtTime(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h ${m % 60}m`;
}

export default async function RecordsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();

  const rows = await db
    .select({
      moduleId: progress.moduleId,
      completedAt: progress.completedAt,
      scrollPct: progress.scrollPct,
      timeMs: progress.timeMs,
      updatedAt: progress.updatedAt,
      title: modules.title,
      slug: modules.slug,
    })
    .from(progress)
    .innerJoin(modules, eq(progress.moduleId, modules.id))
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.updatedAt));

  const myNotes = await db
    .select({
      id: notes.id,
      body: notes.body,
      anchor: notes.anchor,
      createdAt: notes.createdAt,
      title: modules.title,
      slug: modules.slug,
    })
    .from(notes)
    .innerJoin(modules, eq(notes.moduleId, modules.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Records</h1>

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">Progress</h2>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.moduleId}>
            <Link href={`/m/${r.slug}`}>
              <Card className="p-4 flex items-center justify-between gap-3 hover:bg-accent/40 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.completedAt
                      ? `Completed ${new Date(r.completedAt).toLocaleDateString()}`
                      : `In progress · ${r.scrollPct}%`}
                    {" · "}
                    {fmtTime(r.timeMs)} read
                  </div>
                </div>
                {r.completedAt ? <Badge>Done</Badge> : <Badge variant="outline">{r.scrollPct}%</Badge>}
              </Card>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">No progress yet.</Card>
        )}
      </ul>

      <h2 className="mt-8 mb-2 text-sm font-medium text-muted-foreground">Recent notes & highlights</h2>
      <ul className="grid gap-2">
        {myNotes.map((n) => {
          const a = n.anchor as { type: string; text: string };
          return (
            <li key={n.id}>
              <Link href={`/m/${n.slug}`}>
                <Card className="p-4 hover:bg-accent/40 transition-colors">
                  <div className="text-xs text-muted-foreground">{n.title}</div>
                  <blockquote className="mt-1 border-l-2 pl-2 italic text-sm text-muted-foreground line-clamp-2">
                    {a.text}
                  </blockquote>
                  {n.body && <p className="mt-2 text-sm line-clamp-2">{n.body}</p>}
                </Card>
              </Link>
            </li>
          );
        })}
        {myNotes.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">No notes yet.</Card>
        )}
      </ul>
    </div>
  );
}
