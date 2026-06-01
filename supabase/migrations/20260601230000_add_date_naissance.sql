-- Ajout du champ date de naissance dans seances

DO $$ BEGIN
  ALTER TABLE public.seances ADD COLUMN date_naissance date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
