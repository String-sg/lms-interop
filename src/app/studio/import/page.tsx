import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isCreator } from "@/lib/auth";
import { ImportClient } from "./import-client";
import { Skeleton } from "@/components/ui/skeleton";

async function ImportContent() {
  if (!(await isCreator())) redirect("/");
  return <ImportClient />;
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4"><Skeleton className="h-96 w-full" /></div>}>
      <ImportContent />
    </Suspense>
  );
}
