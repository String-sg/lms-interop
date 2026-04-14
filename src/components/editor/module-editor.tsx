"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlockNoteEditor } from "./blocknote-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  id?: string;
  initial?: { title: string; tags: string[]; markdown: string };
};

export function ModuleEditor({ id, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [markdown, setMarkdown] = useState(initial?.markdown ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: title.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          markdown,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { id: string; slug: string };
      toast.success("Saved");
      router.push(`/studio/${data.id}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, intro" />
      </div>

      <BlockNoteEditor initialMarkdown={markdown} onMarkdownChange={setMarkdown} />

      <p className="text-xs text-muted-foreground">
        Tip: link to another module with <code>[[Module Title]]</code>.
      </p>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
