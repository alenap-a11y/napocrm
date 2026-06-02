-- ═══════════════════════════════════════════════════════════════
-- Migration : mise à jour contrainte CHECK statut clients
-- Ajoute 'en_attente' aux valeurs acceptées
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  cname text;
BEGIN
  -- Trouver le nom de la contrainte CHECK sur statut (auto-générée)
  SELECT constraint_name INTO cname
  FROM information_schema.table_constraints
  WHERE table_schema    = 'public'
    AND table_name      = 'clients'
    AND constraint_type = 'CHECK'
    AND constraint_name ILIKE '%statut%';

  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.clients DROP CONSTRAINT ' || quote_ident(cname);
  END IF;

  ALTER TABLE public.clients
    ADD CONSTRAINT clients_statut_chk
    CHECK (statut IN ('actif', 'inactif', 'archivé', 'en_attente'));

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Contrainte statut ignorée : %', SQLERRM;
END $$;
