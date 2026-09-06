-- Add project start dates and preserve task ownership for existing records.
ALTER TABLE "projects"
ADD COLUMN "start_date" DATE;

ALTER TABLE "tasks"
ADD COLUMN "creator_id" TEXT;

UPDATE "tasks" AS tasks
SET "creator_id" = projects."owner_id"
FROM "projects" AS projects
WHERE tasks."project_id" = projects."id";

ALTER TABLE "tasks"
ALTER COLUMN "creator_id" SET NOT NULL;

CREATE INDEX "tasks_creator_id_idx" ON "tasks"("creator_id");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_creator_id_fkey"
FOREIGN KEY ("creator_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "projects"
ADD CONSTRAINT "projects_start_date_due_date_check"
CHECK ("start_date" IS NULL OR "due_date" IS NULL OR "start_date" <= "due_date");