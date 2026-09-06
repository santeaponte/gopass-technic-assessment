-- Enforce unique project names after existing duplicate test data was resolved.
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");