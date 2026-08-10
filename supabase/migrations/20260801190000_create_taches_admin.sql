-- 1 fichier = 1 modification (règle §3.7 Mnapo)
-- Table de suivi de tâches internes, admin-only — même schéma que bugs_admin

CREATE TABLE taches_admin (
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

CREATE TABLE taches_admin_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id uuid NOT NULL REFERENCES taches_admin(id) ON DELETE CASCADE,
  statut_avant text,
  statut_apres text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE taches_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches_admin_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taches_admin_admin_only" ON taches_admin
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "taches_admin_historique_admin_only" ON taches_admin_historique
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE OR REPLACE FUNCTION taches_admin_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.statut = 'fait' AND OLD.statut IS DISTINCT FROM 'fait' THEN
    NEW.resolu_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_taches_admin_updated_at
  BEFORE UPDATE ON taches_admin
  FOR EACH ROW
  EXECUTE FUNCTION taches_admin_set_updated_at();

CREATE OR REPLACE FUNCTION taches_admin_log_historique()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO taches_admin_historique (tache_id, statut_avant, statut_apres)
    VALUES (NEW.id, NULL, NEW.statut);
  ELSIF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO taches_admin_historique (tache_id, statut_avant, statut_apres)
    VALUES (NEW.id, OLD.statut, NEW.statut);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_taches_admin_log_historique
  AFTER INSERT OR UPDATE ON taches_admin
  FOR EACH ROW
  EXECUTE FUNCTION taches_admin_log_historique();