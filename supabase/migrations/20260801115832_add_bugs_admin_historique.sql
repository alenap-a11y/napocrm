-- 1 fichier = 1 modification (règle §3.7 Mnapo)
-- Historique des changements de statut sur bugs_admin (création + chaque transition, horodatés)

CREATE TABLE bugs_admin_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id uuid NOT NULL REFERENCES bugs_admin(id) ON DELETE CASCADE,
  statut_avant text,   -- NULL pour la ligne de création
  statut_apres text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bugs_admin_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bugs_admin_historique_admin_only" ON bugs_admin_historique
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Log automatique : une ligne à la création, une ligne à chaque changement de statut
CREATE OR REPLACE FUNCTION bugs_admin_log_historique()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO bugs_admin_historique (bug_id, statut_avant, statut_apres)
    VALUES (NEW.id, NULL, NEW.statut);
  ELSIF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO bugs_admin_historique (bug_id, statut_avant, statut_apres)
    VALUES (NEW.id, OLD.statut, NEW.statut);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bugs_admin_log_historique
  AFTER INSERT OR UPDATE ON bugs_admin
  FOR EACH ROW
  EXECUTE FUNCTION bugs_admin_log_historique();
