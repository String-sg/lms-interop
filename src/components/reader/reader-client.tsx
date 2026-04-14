"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Highlighter, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  moduleId: string;
  initialCompleted: boolean;
  initialScrollPct: number;
};

type NoteRow = {
  id: string;
  anchor: { type: "highlight" | "note"; start: number; end: number; text: string };
  body: string;
  createdAt: string;
};

export function ReaderClient({ moduleId, initialCompleted, initialScrollPct }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [scrollPct, setScrollPct] = useState(initialScrollPct);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);

  const activeMs = useRef(0);
  const lastTick = useRef<number>(Date.now());
  const visibleRef = useRef<boolean>(true);
  const flushedScroll = useRef(initialScrollPct);

  // Load notes
  useEffect(() => {
    fetch(`/api/notes?moduleId=${moduleId}`)
      .then((r) => r.json())
      .then(setNotes)
      .catch(() => {});
  }, [moduleId]);

  // Scroll tracking
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.round((doc.scrollTop / max) * 100)) : 100;
      setScrollPct((prev) => (pct > prev ? pct : prev));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Time tracking
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (visibleRef.current) activeMs.current += now - lastTick.current;
      lastTick.current = now;
    };
    const interval = setInterval(tick, 1000);
    const onVis = () => {
      tick();
      visibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Flush progress every 15s + on unload
  useEffect(() => {
    const flush = () => {
      const payload = {
        moduleId,
        scrollPct,
        timeMsDelta: activeMs.current,
      };
      activeMs.current = 0;
      flushedScroll.current = scrollPct;
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/progress", blob);
      } else {
        fetch("/api/progress", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    };
    const int = setInterval(flush, 15_000);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(int);
      flush();
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [moduleId, scrollPct]);

  // Capture selection
  useEffect(() => {
    function onSel() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString();
      if (!text.trim()) return;
      const article = document.querySelector("article");
      if (!article) return;
      // crude offset by traversing text nodes
      const range = sel.getRangeAt(0);
      const preRange = document.createRange();
      preRange.selectNodeContents(article);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + text.length;
      setSelection({ start, end, text });
    }
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  async function markComplete() {
    setCompleted(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, scrollPct: 100, completed: true, timeMsDelta: activeMs.current }),
    });
    activeMs.current = 0;
    toast.success("Marked complete");
  }

  async function saveHighlight() {
    if (!selection) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, anchor: { type: "highlight", ...selection }, body: "" }),
    });
    if (res.ok) {
      const { id } = (await res.json()) as { id: string };
      setNotes((n) => [
        ...n,
        { id, anchor: { type: "highlight", ...selection }, body: "", createdAt: new Date().toISOString() },
      ]);
      toast.success("Highlighted");
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    }
  }

  async function saveNote() {
    if (!selection || !noteDraft.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, anchor: { type: "note", ...selection }, body: noteDraft }),
    });
    if (res.ok) {
      const { id } = (await res.json()) as { id: string };
      setNotes((n) => [
        ...n,
        { id, anchor: { type: "note", ...selection }, body: noteDraft, createdAt: new Date().toISOString() },
      ]);
      setNoteDraft("");
      toast.success("Note saved");
    }
  }

  return (
    <>
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-30 h-1 bg-transparent">
        <div className="h-full bg-primary transition-all" style={{ width: `${scrollPct}%` }} />
      </div>

      {/* Selection toolbar */}
      {selection && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-border bg-card shadow-lg">
          <Button variant="ghost" size="sm" onClick={saveHighlight}>
            <Highlighter className="h-4 w-4" />
            Highlight
          </Button>
          <Sheet>
            <SheetTrigger
              className="inline-flex items-center gap-1.5 px-2.5 h-7 text-[0.8rem] rounded-md hover:bg-muted"
            >
              <StickyNote className="h-4 w-4" />
              Note
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80dvh]">
              <SheetHeader>
                <SheetTitle>New note</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-3">
                <blockquote className="border-l-2 pl-2 text-sm italic text-muted-foreground line-clamp-3">
                  {selection.text}
                </blockquote>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Your note…"
                  className="min-h-32"
                />
                <Button onClick={saveNote} className="w-full">
                  Save note
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Mark complete FAB */}
      <Button
        onClick={markComplete}
        disabled={completed}
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Mark complete"
      >
        <Check className="h-6 w-6" />
      </Button>

      {notes.length > 0 && (
        <aside className="mx-auto mt-8 max-w-2xl px-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Your notes ({notes.length})</h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-md border border-border p-3 text-sm">
                <blockquote className="border-l-2 pl-2 italic text-muted-foreground">
                  {n.anchor.text}
                </blockquote>
                {n.body && <p className="mt-2 whitespace-pre-wrap">{n.body}</p>}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
