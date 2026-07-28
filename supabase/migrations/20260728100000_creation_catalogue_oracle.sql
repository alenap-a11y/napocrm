-- Catalogue partage decks/themes Oracle (execute manuellement via SQL editor le 28/07)
-- Conserve ici pour tracabilite, idempotent si rejoue

CREATE TABLE IF NOT EXISTS public.napo_oracle_decks_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.napo_oracle_cartes_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES public.napo_oracle_decks_catalogue(id) ON DELETE CASCADE,
  numero integer,
  nom text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.napo_oracle_themes_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.napo_oracle_questions_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid REFERENCES public.napo_oracle_themes_catalogue(id) ON DELETE CASCADE,
  question text NOT NULL
);

ALTER TABLE public.napo_oracle_decks_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napo_oracle_cartes_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napo_oracle_themes_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napo_oracle_questions_catalogue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lecture_auth" ON public.napo_oracle_decks_catalogue;
DROP POLICY IF EXISTS "lecture_auth" ON public.napo_oracle_cartes_catalogue;
DROP POLICY IF EXISTS "lecture_auth" ON public.napo_oracle_themes_catalogue;
DROP POLICY IF EXISTS "lecture_auth" ON public.napo_oracle_questions_catalogue;
CREATE POLICY "lecture_auth" ON public.napo_oracle_decks_catalogue FOR SELECT TO authenticated USING (true);
CREATE POLICY "lecture_auth" ON public.napo_oracle_cartes_catalogue FOR SELECT TO authenticated USING (true);
CREATE POLICY "lecture_auth" ON public.napo_oracle_themes_catalogue FOR SELECT TO authenticated USING (true);
CREATE POLICY "lecture_auth" ON public.napo_oracle_questions_catalogue FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ecriture_admin" ON public.napo_oracle_decks_catalogue;
DROP POLICY IF EXISTS "ecriture_admin" ON public.napo_oracle_cartes_catalogue;
DROP POLICY IF EXISTS "ecriture_admin" ON public.napo_oracle_themes_catalogue;
DROP POLICY IF EXISTS "ecriture_admin" ON public.napo_oracle_questions_catalogue;
CREATE POLICY "ecriture_admin" ON public.napo_oracle_decks_catalogue FOR ALL TO authenticated USING (public.is_admin_user());
CREATE POLICY "ecriture_admin" ON public.napo_oracle_cartes_catalogue FOR ALL TO authenticated USING (public.is_admin_user());
CREATE POLICY "ecriture_admin" ON public.napo_oracle_themes_catalogue FOR ALL TO authenticated USING (public.is_admin_user());
CREATE POLICY "ecriture_admin" ON public.napo_oracle_questions_catalogue FOR ALL TO authenticated USING (public.is_admin_user());
