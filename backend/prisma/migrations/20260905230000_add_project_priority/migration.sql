-- Add an independent project priority using the existing TaskPriority enum.
ALTER TABLE "projects"
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';