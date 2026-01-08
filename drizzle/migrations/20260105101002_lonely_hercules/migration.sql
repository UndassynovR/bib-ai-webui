CREATE TABLE "book_descriptions" (
	"doc_id" integer PRIMARY KEY,
	"description" text
);
--> statement-breakpoint
CREATE INDEX "book_descriptions_doc_id_idx" ON "book_descriptions" ("doc_id");