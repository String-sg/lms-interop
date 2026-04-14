/**
 * PDF -> Markdown via Mistral Document AI (OCR).
 * Uses the Mistral REST API directly. Set MISTRAL_API_KEY (or route through AI Gateway).
 *
 * Docs: https://docs.mistral.ai/capabilities/document/
 */

type OcrPage = { index: number; markdown: string };
type OcrResponse = { pages: OcrPage[] };

const ENDPOINT = "https://api.mistral.ai/v1/ocr";

export async function pdfToMarkdown(pdfUrl: string): Promise<string> {
  const key = process.env.MISTRAL_API_KEY ?? process.env.AI_GATEWAY_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY or AI_GATEWAY_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: { type: "document_url", document_url: pdfUrl },
      include_image_base64: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mistral OCR failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as OcrResponse;
  return data.pages
    .sort((a, b) => a.index - b.index)
    .map((p) => p.markdown)
    .join("\n\n---\n\n");
}
