-- Ajoute la colonne type_seance (enum) à public.seances
-- Correctif : la conversion silencieuse dans 20260601212716 a pu échouer

-- 1. Créer l'enum si absent
DO $$ BEGIN
  CREATE TYPE public.type_seance_enum AS ENUM (
    'Sophrologie','Coaching','Naturopathie','Énergie','Fleurs de Bach','Autre','Massage'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter la colonne si absente
DO $$ BEGIN
  ALTER TABLE public.seances
    ADD COLUMN type_seance public.type_seance_enum;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Si la colonne existait en text, la convertir en enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'seances'
      AND column_name  = 'type_seance'
      AND data_type    = 'text'
  ) THEN
    UPDATE public.seances
    SET type_seance = 'Autre'
    WHERE type_seance IS NOT NULL
      AND type_seance NOT IN (
        'Sophrologie','Coaching','Naturopathie',
        'Énergie','Fleurs de Bach','Autre','Massage'
      );

    ALTER TABLE public.seances
      ALTER COLUMN type_seance TYPE public.type_seance_enum
      USING type_seance::public.type_seance_enum;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Conversion type ignorée : %', SQLERRM;
END $$;
