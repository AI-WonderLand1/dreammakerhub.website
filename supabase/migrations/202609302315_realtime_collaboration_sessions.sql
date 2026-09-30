-- Real collaboration sessions for owned DreamMakerHub projects.
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_position JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS collaboration_sessions_project_active_idx
  ON public.collaboration_sessions(project_id, is_active, last_seen DESC);

ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read project collaboration sessions" ON public.collaboration_sessions;
CREATE POLICY "Owners can read project collaboration sessions"
  ON public.collaboration_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can maintain own collaboration session" ON public.collaboration_sessions;
CREATE POLICY "Users can maintain own collaboration session"
  ON public.collaboration_sessions
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaboration_sessions TO authenticated;
GRANT ALL ON public.collaboration_sessions TO service_role;

ALTER TABLE public.collaboration_sessions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'collaboration_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_sessions;
  END IF;
END $$;
