import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { modules } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isCreator } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Plus } from "lucide-react";

export default async function StudioPage() {
  if (!(await isCreator())) redirect("/");
  const db = getDb();
  const rows = await db.select().from(modules).orderBy(desc(modules.updatedAt));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
        <div className="flex gap-2">
          <Link href="/studio/import" className={buttonVariants({ variant: "outline" })}>
            <Upload className="h-4 w-4" />
            Import PDF
          </Link>
          <Link href="/studio/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>
      </header>

      <ul className="grid gap-2">
        {rows.map((m) => (
          <li key={m.id}>
            <Link href={`/studio/${m.id}`}>
              <Card className="p-4 hover:bg-accent/40 transition-colors">
                <div className="font-medium truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground">/m/{m.slug}</div>
              </Card>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No modules yet. Create one or import a PDF.
          </Card>
        )}
      </ul>
    </div>
  );
}
