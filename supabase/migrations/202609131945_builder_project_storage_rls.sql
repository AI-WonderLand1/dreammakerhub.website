ALTER TABLE public._projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._project_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own builder projects" ON public._projects;
CREATE POLICY "Users manage own builder projects" ON public._projects
FOR ALL TO authenticated
USING (owner_id = auth.uid()::text)
WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own builder project files" ON public._project_files;
CREATE POLICY "Users manage own builder project files" ON public._project_files
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public._projects p
  WHERE p.id = project_id AND p.owner_id = auth.uid()::text
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public._projects p
  WHERE p.id = project_id AND p.owner_id = auth.uid()::text
));

DROP POLICY IF EXISTS "Users manage own builder project revisions" ON public._project_revisions;
CREATE POLICY "Users manage own builder project revisions" ON public._project_revisions
FOR ALL TO authenticated
USING (
  owner_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public._projects p
    WHERE p.id = project_id AND p.owner_id = auth.uid()::text
  )
)
WITH CHECK (
  owner_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public._projects p
    WHERE p.id = project_id AND p.owner_id = auth.uid()::text
  )
);
