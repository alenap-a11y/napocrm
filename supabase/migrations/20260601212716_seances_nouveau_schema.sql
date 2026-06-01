-- ═══════════════════════════════════════════════════════════════
-- Migration : nouveau schéma seances (version défensive)
-- Schéma source : 20260525_seances_bach.sql
--   colonnes existantes : id, client_id, date_seance, type_seance,
--                         motif, etats_coches, fleurs, score_bien_etre,
--                         notes, created_at
--   manquantes : user_id, heure_seance, duree_minutes, prix_euros,
--                prenom, nom, genre, tel, email, tags, schema_annotations
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Types énumérés (idempotents) ─────────────────────────

DO $$ BEGIN
  CREATE TYPE public.type_seance_enum AS ENUM (
    'Sophrologie','Coaching','Naturopathie','Énergie','Fleurs de Bach','Autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.type_seance_enum ADD VALUE IF NOT EXISTS 'Massage';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tag_observation AS ENUM (
    'Stress','Sommeil','Fatigue','Anxiété','Douleur','Lombaires'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Renommer "date" → date_seance si nécessaire ──────────
-- (déjà date_seance dans le schéma bach, donc no-op)

DO $$ BEGIN
  ALTER TABLE public.seances RENAME COLUMN "date" TO date_seance;
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN duplicate_column  THEN NULL;
END $$;

-- ─── 3. Ajouter toutes les colonnes manquantes ────────────────

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN heure_seance time;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN duree_minutes int NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN prix_euros numeric(8,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN prenom text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN nom text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN genre text CHECK (genre IN ('Homme','Femme','Autre'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN tel text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN email text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN tags public.tag_observation[];
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN schema_annotations jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN updated_at timestamptz DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ─── 4. Convertir type_seance en enum (défensif) ─────────────

DO $$
BEGIN
  -- Vérifier que la colonne est de type text avant de la modifier
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'seances'
      AND column_name  = 'type_seance'
      AND data_type    = 'text'
  ) THEN
    -- Normaliser les valeurs inconnues
    UPDATE public.seances
    SET type_seance = 'Autre'
    WHERE type_seance IS NOT NULL
      AND type_seance NOT IN (
        'Sophrologie','Coaching','Naturopathie',
        'Énergie','Fleurs de Bach','Autre','Massage'
      );

    -- Convertir le type de colonne
    ALTER TABLE public.seances
      ALTER COLUMN type_seance TYPE public.type_seance_enum
      USING type_seance::public.type_seance_enum;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Conversion type_seance ignorée : %', SQLERRM;
END $$;

-- ─── 5. Backfill user_id + prenom/nom depuis clients ─────────

DO $$
DECLARE
  tel_col text;
BEGIN
  -- Détecter le nom réel de la colonne téléphone dans clients
  SELECT column_name INTO tel_col
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'clients'
    AND column_name  IN ('tel','telephone','phone')
  LIMIT 1;

  EXECUTE format(
    $q$
    UPDATE public.seances s
    SET
      user_id = c.user_id,
      prenom  = COALESCE(s.prenom, c.prenom, ''),
      nom     = COALESCE(s.nom,    c.nom,    ''),
      email   = COALESCE(s.email,  c.email),
      tel     = COALESCE(s.tel,    c.%I)
    FROM public.clients c
    WHERE s.client_id = c.id
      AND s.user_id IS NULL
    $q$,
    COALESCE(tel_col, 'email')  -- fallback inoffensif si colonne introuvable
  );
EXCEPTION WHEN others THEN
  -- Backfill sans le tel si la requête échoue
  UPDATE public.seances s
  SET
    user_id = c.user_id,
    prenom  = COALESCE(s.prenom, c.prenom, ''),
    nom     = COALESCE(s.nom,    c.nom,    '')
  FROM public.clients c
  WHERE s.client_id = c.id
    AND s.user_id IS NULL;
END $$;

-- Séances sans client lié : valeurs par défaut
UPDATE public.seances
SET
  prenom  = COALESCE(prenom, ''),
  nom     = COALESCE(nom, '')
WHERE prenom IS NULL OR nom IS NULL;

-- ─── 6. Contraintes NOT NULL (après backfill) ─────────────────

DO $$ BEGIN
  ALTER TABLE public.seances ALTER COLUMN prenom SET NOT NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'prenom NOT NULL ignoré : %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seances ALTER COLUMN nom SET NOT NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'nom NOT NULL ignoré : %', SQLERRM;
END $$;

-- ─── 7. Index ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS seances_user_date_idx
  ON public.seances (user_id, date_seance DESC);

CREATE INDEX IF NOT EXISTS seances_tags_gin_idx
  ON public.seances USING gin (tags);

-- ─── 8. Trigger updated_at ────────────────────────────────────

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
  COUNT(*)                                                       AS total_seances,
  COUNT(*) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE))                     AS seances_ce_mois,
  COALESCE(SUM(prix_euros) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE)), 0)                 AS revenus_ce_mois,
  ROUND(AVG(duree_minutes))                                      AS duree_moyenne_min
FROM public.seances
GROUP BY user_id;

ALTER VIEW public.seances_stats SET (security_invoker = true);

-- ─── 10. RLS ──────────────────────────────────────────────────

ALTER TABLE public.seances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seances_own"                   ON public.seances;
DROP POLICY IF EXISTS "seances_owner"                 ON public.seances;
DROP POLICY IF EXISTS "Utilisateur voit ses séances"  ON public.seances;
DROP POLICY IF EXISTS "Praticien voit ses séances"    ON public.seances;

CREATE POLICY "seances_owner"
  ON public.seances FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
