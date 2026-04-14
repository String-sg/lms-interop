import { slugify } from "../slug";

export type Wikilink = { slug: string; label: string };

const RE = /\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(md: string): Wikilink[] {
  const out: Wikilink[] = [];
  const seen = new Set<string>();
  for (const m of md.matchAll(RE)) {
    const target = m[1].trim();
    const label = (m[2] ?? target).trim();
    const slug = slugify(target);
    if (!seen.has(slug)) {
      seen.add(slug);
      out.push({ slug, label });
    }
  }
  return out;
}

/** Replace [[Target|Label]] -> [Label](/m/target-slug) so MDX renders as normal links. */
export function wikilinksToMarkdownLinks(md: string): string {
  return md.replace(RE, (_, target: string, label?: string) => {
    const slug = slugify(target.trim());
    const text = (label ?? target).trim();
    return `[${text}](/m/${slug})`;
  });
}
