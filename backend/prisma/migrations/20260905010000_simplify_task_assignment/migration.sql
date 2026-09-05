-- Development database migration: existing N:N assignment data is intentionally discarded.

-- Drop the old assignment relation and its data.
DROP TABLE "task_assignees";

-- Add the single nullable responsible user to tasks.
ALTER TABLE "tasks" ADD COLUMN "assignee_id" TEXT;

CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_assignee_id_fkey"
FOREIGN KEY ("assignee_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;