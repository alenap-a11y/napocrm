-- Empêche deux séances actives sur le même créneau pour le même praticien.
-- Découvert le 14/08/2026 : 5 groupes de doublons réels en base (données
-- de test, nettoyés avant la pose de cette contrainte). AgendaPublic.jsx
-- ne revérifiait jamais la disponibilité au moment de l'insertion.
create unique index if not exists uniq_slot_actif_par_praticien
  on seances (user_id, date_seance, heure_seance)
  where statut <> 'annulé';
