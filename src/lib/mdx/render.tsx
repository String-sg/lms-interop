import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import { wikilinksToMarkdownLinks } from "./wikilinks";
import Link from "next/link";
import Image from "next/image";
import type { ComponentProps } from "react";

const components = {
  a: (props: ComponentProps<"a">) => {
    const href = props.href ?? "";
    if (href.startsWith("/") || href.startsWith("#")) {
      return <Link href={href} className="underline text-primary">{props.children}</Link>;
    }
    return <a {...props} className="underline text-primary" target="_blank" rel="noreferrer" />;
  },
  img: (props: ComponentProps<"img">) => (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img {...props} className="rounded-lg my-4 max-w-full h-auto" loading="lazy" />
  ),
  Callout: ({ children, type = "info" }: { children: React.ReactNode; type?: string }) => (
    <div
      className={`my-4 rounded-lg border-l-4 p-4 ${
        type === "warn"
          ? "border-yellow-500 bg-yellow-500/10"
          : type === "danger"
            ? "border-red-500 bg-red-500/10"
            : "border-primary bg-primary/10"
      }`}
    >
      {children}
    </div>
  ),
};

export function parseFrontmatter(raw: string) {
  const { data, content } = matter(raw);
  return { frontmatter: data as Record<string, unknown>, body: content };
}

export async function RenderMdx({ source }: { source: string }) {
  const { body } = parseFrontmatter(source);
  const transformed = wikilinksToMarkdownLinks(body);
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20">
      <MDXRemote
        source={transformed}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </article>
  );
}

// Keep Image available to consumers if needed
export { Image };
