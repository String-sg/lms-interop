"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ModuleEditor } from "@/components/editor/module-editor";

export function ImportClient() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ title: string; markdown: string } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { markdown: string; filename: string };
      const title = data.filename.replace(/\.pdf$/i, "");
      setResult({ title, markdown: data.markdown });
      toast.success("Parsed — review and save below.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (result) {
    return <ModuleEditor initial={{ title: result.title, tags: [], markdown: result.markdown }} />;
  }

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Import PDF</h1>
      <p className="text-sm text-muted-foreground">
        Upload a PDF. We&apos;ll OCR it to markdown and drop it into the editor for cleanup.
      </p>
      <label className="block">
        <span className="sr-only">PDF</span>
        <Input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} />
      </label>
      {uploading && (
        <div className="text-sm text-muted-foreground">Parsing — this can take a minute…</div>
      )}
      <div>
        <Button variant="outline" onClick={() => { window.location.href = "/studio"; }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
