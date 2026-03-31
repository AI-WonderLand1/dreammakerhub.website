-- wonder_build_builder_tables.sql
-- Tables for Wonder-Build component library and canvas persistence.
CREATE TABLE IF NOT EXISTS public.components (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  content jsonb,
  styles jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.canvas_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text UNIQUE NOT NULL,
  elements jsonb NOT NULL,
  css text,
  updated_at timestamptz DEFAULT now()
);
