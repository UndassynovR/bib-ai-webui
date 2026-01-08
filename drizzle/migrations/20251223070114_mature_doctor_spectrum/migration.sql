CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"doc_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks" ("user_id");--> statement-breakpoint
CREATE INDEX "bookmarks_doc_id_idx" ON "bookmarks" ("doc_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_doc_unique" ON "bookmarks" ("user_id","doc_id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;