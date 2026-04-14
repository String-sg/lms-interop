"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";

type Props = {
  initialMarkdown?: string;
  onMarkdownChange?: (md: string) => void;
};

export function BlockNoteEditor({ initialMarkdown = "", onMarkdownChange }: Props) {
  const editor = useCreateBlockNote();
  const [ready, setReady] = useState(false);

  // Load initial markdown into editor
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initialMarkdown) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
        if (cancelled) return;
        editor.replaceBlocks(editor.document, blocks);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <BlockNoteView
        editor={editor}
        theme="dark"
        onChange={async () => {
          if (!ready || !onMarkdownChange) return;
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onMarkdownChange(md);
        }}
      />
    </div>
  );
}
