-- Enforce unique task titles within each project.
CREATE UNIQUE INDEX "tasks_project_id_title_key" ON "tasks"("project_id", "title");
