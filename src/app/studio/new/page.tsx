import { redirect } from "next/navigation";
import { isCreator } from "@/lib/auth";
import { ModuleEditor } from "@/components/editor/module-editor";

export default async function NewModulePage() {
  if (!(await isCreator())) redirect("/");
  return <ModuleEditor />;
}
