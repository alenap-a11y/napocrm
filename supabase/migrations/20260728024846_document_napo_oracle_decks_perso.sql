CREATE TABLE IF NOT EXISTS public.napo_oracle_decks_perso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  nom text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, nom)
);

CREATE TABLE IF NOT EXISTS public.napo_oracle_cartes_perso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  deck_id uuid REFERENCES public.napo_oracle_decks_perso(id) NOT NULL,
  nom text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(deck_id, nom)
);

CREATE TABLE IF NOT EXISTS public.napo_oracle_questions_perso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  texte text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, texte)
);

ALTER TABLE public.napo_oracle_decks_perso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napo_oracle_cartes_perso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napo_oracle_questions_perso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decks_perso_all" ON public.napo_oracle_decks_perso;
CREATE POLICY "decks_perso_all" ON public.napo_oracle_decks_perso FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cartes_perso_all" ON public.napo_oracle_cartes_perso;
CREATE POLICY "cartes_perso_all" ON public.napo_oracle_cartes_perso FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "questions_perso_all" ON public.napo_oracle_questions_perso;
CREATE POLICY "questions_perso_all" ON public.napo_oracle_questions_perso FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
