import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isCreator } from "@/lib/auth";
import { ModuleEditor } from "@/components/editor/module-editor";
import { Skeleton } from "@/components/ui/skeleton";

async function NewModuleContent() {
  if (!(await isCreator())) redirect("/");
  return <ModuleEditor />;
}

export default function NewModulePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4"><Skeleton className="h-96 w-full" /></div>}>
      <NewModuleContent />
    </Suspense>
  );
}
