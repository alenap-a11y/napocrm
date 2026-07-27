ALTER TABLE public.energie_seances
  ADD COLUMN IF NOT EXISTS mesures_avant jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mesures_apres jsonb DEFAULT '[]'::jsonb;