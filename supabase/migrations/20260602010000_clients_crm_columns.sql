-- ═══════════════════════════════════════════════════════════════
-- Migration : colonnes CRM manquantes dans clients
-- Générée le 2026-06-02
-- ville, specialite, statut
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN ville text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN specialite text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN statut text DEFAULT 'actif'
    CHECK (statut IN ('actif', 'inactif', 'archivé'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS clients_statut_idx   ON public.clients (user_id, statut);
CREATE INDEX IF NOT EXISTS clients_specialite_idx ON public.clients (user_id, specialite);
