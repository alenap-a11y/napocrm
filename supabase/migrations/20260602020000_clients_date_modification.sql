-- ═══════════════════════════════════════════════════════════════
-- Migration : date_modification dans clients
-- Générée le 2026-06-02
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN date_modification timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
