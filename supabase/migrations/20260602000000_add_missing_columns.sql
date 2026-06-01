-- ═══════════════════════════════════════════════════════════════
-- Migration : colonnes manquantes seances + clients
-- Générée le 2026-06-02
-- Colonnes ajoutées :
--   seances  → date_creation, premiere_seance
--   clients  → date_naissance, genre, derniere_seance, date_creation
-- ═══════════════════════════════════════════════════════════════

-- ─── TABLE seances ────────────────────────────────────────────

-- date_creation : horodatage explicite de création de la séance
DO $$ BEGIN
  ALTER TABLE public.seances
    ADD COLUMN date_creation timestamptz DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- premiere_seance : true si aucune séance précédente trouvée pour ce client
DO $$ BEGIN
  ALTER TABLE public.seances
    ADD COLUMN premiere_seance boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ─── TABLE clients ────────────────────────────────────────────

-- date_naissance : date de naissance du client
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN date_naissance date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- genre : Homme / Femme / Autre
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN genre text CHECK (genre IN ('Homme', 'Femme', 'Autre'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

-- derniere_seance : date de la dernière séance enregistrée (mise à jour par syncClient)
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN derniere_seance date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- date_creation : horodatage de création de la fiche client
DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN date_creation timestamptz DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ─── Index utiles ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS seances_premiere_idx
  ON public.seances (user_id, premiere_seance);

CREATE INDEX IF NOT EXISTS clients_derniere_seance_idx
  ON public.clients (user_id, derniere_seance DESC);
