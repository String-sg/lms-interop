import { redirect } from "next/navigation";
import { isCreator } from "@/lib/auth";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  if (!(await isCreator())) redirect("/");
  return <ImportClient />;
}
