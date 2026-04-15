"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useModuleId } from "@/lib/mdx/module-context";

export type QuizProps = {
  id: string;
  question: string;
  options: string[];
  answer: number; // 0-based index of the correct option
  explanation?: string;
};

export function Quiz({ id, question, options, answer, explanation }: QuizProps) {
  const moduleId = useModuleId();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!Array.isArray(options) || options.length < 2) {
    return (
      <Card className="my-6 p-4 text-sm text-destructive">
        Quiz <code>{id}</code> is missing valid options.
      </Card>
    );
  }

  const correct = selected !== null && selected === answer;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);

    // Resolve moduleId — context first, then DOM fallback so the component
    // works even if a future caller forgets the ModuleProvider wrapper.
    let resolvedModuleId = moduleId;
    if (!resolvedModuleId && typeof document !== "undefined") {
      resolvedModuleId =
        document
          .querySelector<HTMLElement>("article[data-module-id]")
          ?.dataset.moduleId ?? null;
    }
    if (!resolvedModuleId) return;

    // Fire-and-forget — never block the UI on the network.
    void fetch("/api/quiz-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: resolvedModuleId,
        quizId: id,
        selected,
        correct: selected === answer,
      }),
      keepalive: true,
    }).catch(() => {
      /* swallow — quiz UI must not depend on network */
    });
  }

  function handleRetry() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <Card className="not-prose my-6 p-4 sm:p-5 border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-sm sm:text-base leading-snug">
          {question}
        </p>
        {submitted && (
          <Badge variant={correct ? "default" : "outline"}>
            {correct ? "Correct" : "Incorrect"}
          </Badge>
        )}
      </div>

      <ul className="mt-3 grid gap-2">
        {options.map((opt, i) => {
          const isPicked = selected === i;
          const isCorrect = submitted && i === answer;
          const isWrongPick = submitted && isPicked && i !== answer;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={submitted}
                onClick={() => setSelected(i)}
                aria-pressed={isPicked}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-3 min-h-[44px] text-sm transition-colors",
                  "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-default",
                  !submitted && isPicked && "border-primary bg-primary/10",
                  !submitted && !isPicked && "border-border",
                  isCorrect && "border-green-500/60 bg-green-500/10",
                  isWrongPick && "border-red-500/60 bg-red-500/10",
                  submitted && !isCorrect && !isWrongPick && "border-border opacity-70",
                )}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {submitted && explanation && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selected === null}
            size="lg"
            className="w-full sm:w-auto"
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleRetry}
            size="lg"
            className="w-full sm:w-auto"
          >
            Try again
          </Button>
        )}
      </div>
    </Card>
  );
}
