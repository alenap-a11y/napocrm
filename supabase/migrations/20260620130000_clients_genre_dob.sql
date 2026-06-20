-- ─── Ajout genre + date_naissance sur clients ───────────────────────────────
-- Permet à l'autocomplete NouvelleSeance de lire et pré-remplir ces champs
-- depuis la fiche client existante.

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN genre text CHECK (genre IN ('Homme','Femme','Autre'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN date_naissance date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill depuis seances : première séance trouvée par client
UPDATE public.clients c
SET
  genre          = COALESCE(c.genre,          s.genre),
  date_naissance = COALESCE(c.date_naissance, s.date_naissance)
FROM (
  SELECT DISTINCT ON (client_id) client_id, genre, date_naissance
  FROM public.seances
  WHERE client_id IS NOT NULL
  ORDER BY client_id, date_seance DESC
) s
WHERE s.client_id = c.id
  AND (c.genre IS NULL OR c.date_naissance IS NULL);
