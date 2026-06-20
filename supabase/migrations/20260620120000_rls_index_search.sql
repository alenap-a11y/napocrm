-- ─── Extension trigram (nécessaire pour GIN ilike) ──────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── RLS : clients ───────────────────────────────────────────────────────────
-- La policy ALL "clients_own" existe déjà (USING auth.uid() = user_id).
-- On la remplace par une version (select auth.uid()) pour la perf RLS
-- (évite une évaluation par ligne, recommandé Supabase docs).
DROP POLICY IF EXISTS "clients_own"       ON clients;
DROP POLICY IF EXISTS "select_own_rows"   ON clients;

CREATE POLICY "select_own_rows" ON clients
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "clients_own" ON clients
  FOR ALL
  USING ((select auth.uid()) = user_id);

-- ─── RLS : taches ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "taches_own"        ON taches;
DROP POLICY IF EXISTS "select_own_rows"   ON taches;

CREATE POLICY "select_own_rows" ON taches
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "taches_own" ON taches
  FOR ALL
  USING ((select auth.uid()) = user_id);

-- ─── Index GIN trigram : clients ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_nom    ON clients USING gin (nom    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_prenom ON clients USING gin (prenom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_email  ON clients USING gin (email  gin_trgm_ops);

-- ─── Index GIN trigram : taches ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_taches_titre   ON taches  USING gin (titre  gin_trgm_ops);

-- Note : pas de table `factures` en Supabase (stockage local dans le front),
-- donc aucun index ni policy à créer pour cette table.
