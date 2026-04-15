import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Suspense fallback={<Skeleton className="h-96 w-80 rounded-xl" />}>
        <SignIn />
      </Suspense>
    </div>
  );
}
