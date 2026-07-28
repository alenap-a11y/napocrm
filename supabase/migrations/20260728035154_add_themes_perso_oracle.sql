CREATE TABLE IF NOT EXISTS public.napo_oracle_themes_perso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  nom text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, nom)
);

ALTER TABLE public.napo_oracle_themes_perso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "themes_perso_all" ON public.napo_oracle_themes_perso;
CREATE POLICY "themes_perso_all" ON public.napo_oracle_themes_perso FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.napo_oracle_questions_perso
  ADD COLUMN IF NOT EXISTS theme_id uuid REFERENCES public.napo_oracle_themes_perso(id);
