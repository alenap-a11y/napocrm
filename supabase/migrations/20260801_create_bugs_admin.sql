-- 1 fichier = 1 modification (règle §3.7 Mnapo)
-- Table interne de suivi de bugs, réservée admin (ni testeurs ni praticiens)

CREATE TABLE bugs_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  statut text NOT NULL DEFAULT 'a_faire'
    CHECK (statut IN ('a_faire', 'en_cours', 'fait')),
  priorite text NOT NULL DEFAULT 'utile'
    CHECK (priorite IN ('bloquant', 'utile', 'habillage')),
  fichier_concerne text,
  commit_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolu_at timestamptz
);

-- updated_at auto
CREATE OR REPLACE FUNCTION bugs_admin_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.statut = 'fait' AND OLD.statut IS DISTINCT FROM 'fait' THEN
    NEW.resolu_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bugs_admin_updated_at
  BEFORE UPDATE ON bugs_admin
  FOR EACH ROW
  EXECUTE FUNCTION bugs_admin_set_updated_at();

-- RLS : admin uniquement, lecture ET écriture (piège §3.11 : ne PAS faire
-- une policy FOR ALL unique, même admin-only, si un jour un non-admin doit lire)
ALTER TABLE bugs_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bugs_admin_select_admin" ON bugs_admin
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY "bugs_admin_write_admin" ON bugs_admin
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());
