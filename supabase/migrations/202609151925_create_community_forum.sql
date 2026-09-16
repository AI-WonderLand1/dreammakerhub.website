CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('announcements','showcase','q&a','help','general')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_votes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_category_idx ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS community_comments_post_id_idx ON public.community_comments(post_id, created_at);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community posts are publicly readable" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "authenticated users can create community posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors can update own community posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors can delete own community posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "community comments are publicly readable" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "authenticated users can create comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors can update own comments" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors can delete own comments" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "community votes are publicly readable" ON public.community_votes FOR SELECT USING (true);
CREATE POLICY "authenticated users can vote" ON public.community_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated users can remove own vote" ON public.community_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
