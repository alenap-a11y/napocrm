-- Ordre d'exécution : types.sql → seances.sql → seances_stats.sql

CREATE TABLE IF NOT EXISTS public.seances (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- client (dénormalisé — saisie libre, pas de FK clients pour l'instant)
  prenom       text NOT NULL,
  nom          text NOT NULL,
  genre        text CHECK (genre IN ('Homme','Femme','Autre')),
  tel          text,
  email        text,

  -- séance
  date_seance    date NOT NULL,
  heure_seance   time NOT NULL,
  duree_minutes  int  NOT NULL DEFAULT 60,
  prix_euros     numeric(8,2),
  type_seance    type_seance_enum,

  -- observations
  notes          text,
  tags           tag_observation[],

  -- schéma corporel
  schema_annotations  jsonb,  -- [{id,position:[x,y,z],color,radius,label}]

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Index utiles
CREATE INDEX ON public.seances (user_id, date_seance DESC);
CREATE INDEX ON public.seances USING gin (tags);

-- RLS : chaque utilisateur ne voit que ses propres séances
ALTER TABLE public.seances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seances_owner"
  ON public.seances FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at auto
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER seances_updated_at
  BEFORE UPDATE ON public.seances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
