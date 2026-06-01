-- ═══════════════════════════════════════════════════════════════
-- Migration : nouveau schéma seances
-- Stratégie : ALTER TABLE + backfill depuis clients (sans DROP)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Types énumérés (idempotents) ─────────────────────────

DO $$ BEGIN
  CREATE TYPE type_seance_enum AS ENUM (
    'Sophrologie','Coaching','Naturopathie','Énergie','Fleurs de Bach','Autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ajouter 'Massage' si des données existantes l'utilisent
DO $$ BEGIN
  ALTER TYPE type_seance_enum ADD VALUE IF NOT EXISTS 'Massage';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tag_observation AS ENUM (
    'Stress','Sommeil','Fatigue','Anxiété','Douleur','Lombaires'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Renommer les colonnes existantes ──────────────────────

DO $$ BEGIN
  ALTER TABLE public.seances RENAME COLUMN "date"  TO date_seance;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances RENAME COLUMN heure TO heure_seance;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances RENAME COLUMN duree TO duree_minutes;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances RENAME COLUMN prix TO prix_euros;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- ─── 3. Ajouter les nouvelles colonnes ────────────────────────

ALTER TABLE public.seances
  ADD COLUMN IF NOT EXISTS prenom           text,
  ADD COLUMN IF NOT EXISTS nom              text,
  ADD COLUMN IF NOT EXISTS genre            text CHECK (genre IN ('Homme','Femme','Autre')),
  ADD COLUMN IF NOT EXISTS tel              text,
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS tags             tag_observation[],
  ADD COLUMN IF NOT EXISTS schema_annotations jsonb;

-- ─── 4. Typer type_seance en enum ────────────────────────────
-- Mapper les valeurs inconnues vers 'Autre' avant la conversion

UPDATE public.seances
SET type_seance = 'Autre'
WHERE type_seance IS NOT NULL
  AND type_seance NOT IN (
    'Sophrologie','Coaching','Naturopathie',
    'Énergie','Fleurs de Bach','Autre','Massage'
  );

DO $$ BEGIN
  ALTER TABLE public.seances
    ALTER COLUMN type_seance TYPE type_seance_enum
    USING type_seance::type_seance_enum;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Conversion type_seance ignorée : %', SQLERRM;
END $$;

-- ─── 5. Backfill prenom/nom depuis la table clients ──────────

UPDATE public.seances s
SET
  prenom = COALESCE(c.prenom, ''),
  nom    = COALESCE(c.nom, ''),
  email  = COALESCE(s.email, c.email),
  tel    = COALESCE(s.tel, c.telephone)
FROM public.clients c
WHERE s.client_id = c.id
  AND (s.prenom IS NULL OR s.nom IS NULL);

-- Valeur par défaut pour les séances sans client lié
UPDATE public.seances
SET prenom = '', nom = ''
WHERE prenom IS NULL OR nom IS NULL;

-- ─── 6. Contraintes NOT NULL (après backfill) ─────────────────

ALTER TABLE public.seances
  ALTER COLUMN prenom        SET NOT NULL,
  ALTER COLUMN nom           SET NOT NULL,
  ALTER COLUMN date_seance   SET NOT NULL,
  ALTER COLUMN duree_minutes SET DEFAULT 60;

-- ─── 7. Index (IF NOT EXISTS évite les doublons) ──────────────

CREATE INDEX IF NOT EXISTS seances_user_date_idx ON public.seances (user_id, date_seance DESC);
CREATE INDEX IF NOT EXISTS seances_tags_gin_idx  ON public.seances USING gin (tags);

-- ─── 8. Trigger updated_at ────────────────────────────────────

ALTER TABLE public.seances ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS seances_updated_at ON public.seances;
CREATE TRIGGER seances_updated_at
  BEFORE UPDATE ON public.seances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 9. Vue KPIs ─────────────────────────────────────────────

CREATE OR REPLACE VIEW public.seances_stats AS
SELECT
  user_id,
  COUNT(*)                                                          AS total_seances,
  COUNT(*) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE))                        AS seances_ce_mois,
  COALESCE(SUM(prix_euros) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE)), 0)                    AS revenus_ce_mois,
  ROUND(AVG(duree_minutes))                                         AS duree_moyenne_min
FROM public.seances
GROUP BY user_id;

ALTER VIEW public.seances_stats SET (security_invoker = true);

-- ─── 10. RLS ─────────────────────────────────────────────────

ALTER TABLE public.seances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seances_own"        ON public.seances;
DROP POLICY IF EXISTS "seances_owner"      ON public.seances;
DROP POLICY IF EXISTS "Utilisateur voit ses séances" ON public.seances;

CREATE POLICY "seances_owner"
  ON public.seances FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
