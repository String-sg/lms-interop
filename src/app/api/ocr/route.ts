import { NextResponse } from "next/server";
import { putPdf } from "@/lib/blob";
import { pdfToMarkdown } from "@/lib/ocr/mistral";
import { requireUser, isCreator } from "@/lib/auth";

export const maxDuration = 300;

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!(await isCreator())) return new NextResponse("Forbidden", { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Must be a PDF" }, { status: 400 });
  }

  try {
    const pdfUrl = await putPdf(userId, file);
    const markdown = await pdfToMarkdown(pdfUrl);
    return NextResponse.json({ markdown, filename: file.name });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
