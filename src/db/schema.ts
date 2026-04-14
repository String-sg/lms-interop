import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const modules = pgTable(
  "modules",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    tags: text("tags").array().notNull().default([]),
    mdxBlobUrl: text("mdx_blob_url").notNull(),
    frontmatter: jsonb("frontmatter").notNull().default({}),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: index("modules_slug_idx").on(t.slug),
  }),
);

export const moduleLinks = pgTable(
  "module_links",
  {
    fromId: text("from_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    toSlug: text("to_slug").notNull(), // may reference non-existent module
    label: text("label"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fromId, t.toSlug] }),
    toIdx: index("module_links_to_idx").on(t.toSlug),
  }),
);

export const progress = pgTable(
  "progress",
  {
    userId: text("user_id").notNull(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    scrollPct: integer("scroll_pct").notNull().default(0),
    timeMs: integer("time_ms").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.moduleId] }),
    userIdx: index("progress_user_idx").on(t.userId),
  }),
);

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    anchor: jsonb("anchor").notNull(), // { type: 'highlight'|'note', start, end, text }
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userModuleIdx: index("notes_user_module_idx").on(t.userId, t.moduleId),
  }),
);

export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  pdfBlobUrl: text("pdf_blob_url").notNull(),
  status: text("status").notNull().default("pending"), // pending|parsing|done|error
  parsedMdx: text("parsed_mdx"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const modulesRelations = relations(modules, ({ many }) => ({
  links: many(moduleLinks),
}));
