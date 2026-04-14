import { put, del } from "@vercel/blob";

export async function putMdx(slug: string, mdx: string) {
  const b = await put(`modules/${slug}-${Date.now()}.mdx`, mdx, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });
  return b.url;
}

export async function putPdf(userId: string, file: File) {
  const b = await put(`uploads/${userId}/${Date.now()}-${file.name}`, file, {
    access: "private",
    contentType: "application/pdf",
  });
  return b.url;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
  return res.text();
}

export { del };
