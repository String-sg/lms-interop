"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Node = { id: string; slug: string; title: string; x: number; y: number; vx: number; vy: number };
type Edge = { from: string; to: string };

type Props = {
  nodes: { id: string; slug: string; title: string }[];
  edges: Edge[];
};

export function GraphView({ nodes: input, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [size, setSize] = useState({ w: 360, h: 520 });

  useEffect(() => {
    const onResize = () => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Init node positions
  useEffect(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    setNodes(
      input.map((n, i) => ({
        ...n,
        x: cx + Math.cos((i / Math.max(1, input.length)) * 2 * Math.PI) * 80,
        y: cy + Math.sin((i / Math.max(1, input.length)) * 2 * Math.PI) * 80,
        vx: 0,
        vy: 0,
      })),
    );
  }, [input, size.w, size.h]);

  // Simple force simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    let raf = 0;
    let running = true;
    const step = () => {
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const byId = new Map(next.map((n) => [n.id, n]));
        // repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy + 0.01;
            const f = 1200 / d2;
            const fx = (dx / Math.sqrt(d2)) * f;
            const fy = (dy / Math.sqrt(d2)) * f;
            a.vx += fx; a.vy += fy;
            b.vx -= fx; b.vy -= fy;
          }
        }
        // spring along edges
        for (const e of edges) {
          const a = byId.get(e.from); const b = byId.get(e.to);
          if (!a || !b) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const f = (d - 90) * 0.02;
          const fx = (dx / d) * f; const fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
        const cx = size.w / 2, cy = size.h / 2;
        for (const n of next) {
          n.vx += (cx - n.x) * 0.002;
          n.vy += (cy - n.y) * 0.002;
          n.vx *= 0.82; n.vy *= 0.82;
          n.x += n.vx; n.y += n.vy;
          n.x = Math.max(20, Math.min(size.w - 20, n.x));
          n.y = Math.max(20, Math.min(size.h - 20, n.y));
        }
        return next;
      });
      if (running) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const stop = setTimeout(() => (running = false), 4000);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(stop);
    };
  }, [edges, size.w, size.h, nodes.length]);

  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="rounded-lg border border-border bg-card">
      <svg ref={svgRef} viewBox={`0 0 ${size.w} ${size.h}`} width="100%" height={size.h} className="touch-none">
        {edges.map((e, i) => {
          const a = byId.get(e.from); const b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="currentColor"
              className="text-muted-foreground/40"
              strokeWidth={1}
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
            <Link href={`/m/${n.slug}`}>
              <circle r={10} className="fill-primary" />
              <text
                y={22}
                textAnchor="middle"
                className="fill-foreground text-[10px]"
              >
                {n.title.length > 18 ? n.title.slice(0, 16) + "…" : n.title}
              </text>
            </Link>
          </g>
        ))}
      </svg>
    </div>
  );
}
