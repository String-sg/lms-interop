"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Network, CheckSquare, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Library", icon: BookOpen },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/records", label: "Records", icon: CheckSquare },
  { href: "/studio", label: "Studio", icon: Pencil },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
