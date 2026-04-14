CREATE TABLE "module_links" (
	"from_id" text NOT NULL,
	"to_slug" text NOT NULL,
	"label" text,
	CONSTRAINT "module_links_from_id_to_slug_pk" PRIMARY KEY("from_id","to_slug")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"mdx_blob_url" text NOT NULL,
	"frontmatter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"module_id" text NOT NULL,
	"anchor" jsonb NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"user_id" text NOT NULL,
	"module_id" text NOT NULL,
	"completed_at" timestamp with time zone,
	"scroll_pct" integer DEFAULT 0 NOT NULL,
	"time_ms" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_user_id_module_id_pk" PRIMARY KEY("user_id","module_id")
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pdf_blob_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"parsed_mdx" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_links" ADD CONSTRAINT "module_links_from_id_modules_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "module_links_to_idx" ON "module_links" USING btree ("to_slug");--> statement-breakpoint
CREATE INDEX "modules_slug_idx" ON "modules" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notes_user_module_idx" ON "notes" USING btree ("user_id","module_id");--> statement-breakpoint
CREATE INDEX "progress_user_idx" ON "progress" USING btree ("user_id");