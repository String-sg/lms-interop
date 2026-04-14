import { cacheTag, cacheLife } from "next/cache";
import { getDb } from "@/db/client";
import { modules, moduleLinks } from "@/db/schema";
import { GraphView } from "@/components/graph/graph-view";

async function getGraph() {
  "use cache";
  cacheTag("graph");
  cacheLife("minutes");
  const db = getDb();
  const mods = await db.select({ id: modules.id, slug: modules.slug, title: modules.title }).from(modules);
  const links = await db
    .select({ fromId: moduleLinks.fromId, toSlug: moduleLinks.toSlug })
    .from(moduleLinks);
  const slugToId = new Map(mods.map((m) => [m.slug, m.id]));
  const edges = links
    .map((l) => ({ from: l.fromId, to: slugToId.get(l.toSlug) }))
    .filter((e): e is { from: string; to: string } => !!e.to);
  return { nodes: mods, edges };
}

export default async function GraphPage() {
  const { nodes, edges } = await getGraph();
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Graph</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {nodes.length} modules · {edges.length} links
      </p>
      <GraphView nodes={nodes} edges={edges} />
    </div>
  );
}
