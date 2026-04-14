import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
