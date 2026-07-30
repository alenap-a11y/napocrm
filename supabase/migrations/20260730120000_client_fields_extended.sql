-- ═══════════════════════════════════════════════════════════════
-- Migration : champs fiche client étendue
-- Générée le 2026-07-30
-- nom_naissance, adresse (numero/rue/complement/code_postal),
-- situation_familiale, environnement, situation_professionnelle,
-- nombre_enfants
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN nom_naissance text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN adresse_numero text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN adresse_rue text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN adresse_complement text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN code_postal text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN situation_familiale text
    CHECK (situation_familiale IN ('marie', 'divorce', 'celibataire', 'veuf', 'veuve', 'separe'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN environnement text
    CHECK (environnement IN ('toxique', 'non_toxique'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN situation_professionnelle text
    CHECK (situation_professionnelle IN ('actif', 'chomage', 'retraite', 'invalide_malade'));
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clients
    ADD COLUMN nombre_enfants integer
    CHECK (nombre_enfants >= 0);
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN duplicate_object  THEN NULL;
END $$;
