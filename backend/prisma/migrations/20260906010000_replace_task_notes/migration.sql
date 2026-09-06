-- Replace the single task notes field with an auditable notes collection.
CREATE TABLE "task_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_notes_task_id_created_at_idx" ON "task_notes"("task_id", "created_at");
CREATE INDEX "task_notes_author_id_idx" ON "task_notes"("author_id");
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" DROP COLUMN "notes";
