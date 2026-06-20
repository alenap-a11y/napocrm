ALTER TABLE seances ADD COLUMN IF NOT EXISTS etats_coches jsonb DEFAULT '{}'::jsonb;
