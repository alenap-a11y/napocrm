-- ═══════════════════════════════════════════════════════════════
-- Migration : enrichissement table notes + recherche full-text
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Nouvelles colonnes ────────────────────────────────────

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS titre      text,
  ADD COLUMN IF NOT EXISTS categorie  text DEFAULT 'Autre',
  ADD COLUMN IF NOT EXISTS client_nom text,
  ADD COLUMN IF NOT EXISTS date_note  date NOT NULL DEFAULT CURRENT_DATE;

-- Backfill date_note depuis created_at pour l'existant
UPDATE public.notes
SET date_note = created_at::date
WHERE date_note = CURRENT_DATE AND created_at < now() - interval '1 minute';

-- ─── 2. Colonne tsvector générée (French) ─────────────────────
-- Permet l'utilisation de .textSearch() côté Supabase JS

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('french',
        coalesce(titre,   '') || ' ' ||
        coalesce(contenu, '') || ' ' ||
        coalesce(client_nom, '')
      )
    ) STORED;

-- ─── 3. Index GIN sur fts ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS notes_fts_gin_idx
  ON public.notes USING gin (fts);

-- Index standard utiles
CREATE INDEX IF NOT EXISTS notes_user_date_idx
  ON public.notes (user_id, date_note DESC);

CREATE INDEX IF NOT EXISTS notes_categorie_idx
  ON public.notes (user_id, categorie);

-- ─── 4. RLS ───────────────────────────────────────────────────

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_own" ON public.notes;

CREATE POLICY "notes_owner"
  ON public.notes FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
