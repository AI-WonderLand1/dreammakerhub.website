-- Create scenes table for 3D scene storage
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.scenes (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}',
  thumbnail text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public scenes
CREATE POLICY "Public scenes are viewable by everyone"
  ON public.scenes FOR SELECT
  USING (is_public = true);

-- Policy: Users can insert their own scenes
CREATE POLICY "Users can insert their own scenes"
  ON public.scenes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own scenes
CREATE POLICY "Users can update their own scenes"
  ON public.scenes FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own scenes
CREATE POLICY "Users can delete their own scenes"
  ON public.scenes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON public.scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON public.scenes(updated_at DESC);