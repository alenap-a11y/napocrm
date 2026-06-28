-- Nettoyage policies redondantes clients
DROP POLICY IF EXISTS "select_own_rows" ON clients;
DROP POLICY IF EXISTS "clients_own"     ON clients;
CREATE POLICY "clients_owner"
  ON clients FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nettoyage policies redondantes taches
DROP POLICY IF EXISTS "select_own_rows" ON taches;
DROP POLICY IF EXISTS "taches_own"      ON taches;
CREATE POLICY "taches_owner"
  ON taches FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
