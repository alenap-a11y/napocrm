ALTER TABLE public.napo_oracle_seances
  ADD COLUMN IF NOT EXISTS cartes_tirees jsonb DEFAULT '[]'::jsonb;
