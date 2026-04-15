"use client";

import { createContext, useContext, type ReactNode } from "react";

const ModuleContext = createContext<{ moduleId: string } | null>(null);

export function ModuleProvider({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  // React 19: Context can be used as a Provider directly.
  return (
    <ModuleContext value={{ moduleId }}>{children}</ModuleContext>
  );
}

/**
 * Returns the current moduleId, or null if used outside a ModuleProvider.
 * Components like <Quiz> should fall back gracefully (e.g. read a
 * data-module-id attribute from a parent) when this returns null.
 */
export function useModuleId(): string | null {
  return useContext(ModuleContext)?.moduleId ?? null;
}
