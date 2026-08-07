-- 1 fichier = 1 modification (règle §3.7 Mnapo)
-- Historique des versions par module (admin) : suivi des améliorations livrées, par module et par version

CREATE TABLE module_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_nom text NOT NULL,
  version text NOT NULL,
  amelioration text NOT NULL,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS : admin uniquement, lecture ET écriture (piège §3.11 : ne PAS faire
-- une policy FOR ALL unique, même admin-only, si un jour un non-admin doit lire)
ALTER TABLE module_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_versions_select_admin" ON module_versions
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY "module_versions_write_admin" ON module_versions
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());