ALTER TABLE seances ADD COLUMN IF NOT EXISTS statut text DEFAULT 'planifié';

INSERT INTO seances (user_id, client_id, date_seance, heure_seance, type_seance, statut, notes, created_at, prenom, nom)
SELECT 
  rv.user_id,
  rv.client_id,
  rv.date_rdv::date,
  rv.date_rdv::time,
  rv.type_seance::type_seance_enum,
  rv.statut,
  rv.notes,
  rv.created_at,
  COALESCE(c.prenom, 'Client'),
  COALESCE(c.nom, 'non renseigné')
FROM rendez_vous rv
LEFT JOIN clients c ON c.id = rv.client_id;
