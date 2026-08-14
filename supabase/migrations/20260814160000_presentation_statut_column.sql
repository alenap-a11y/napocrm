-- Page "Présentation du praticien" — colonne de statut de publication.
-- Fichier créé rétroactivement : cette colonne était déjà appliquée en
-- base (hors pipeline versionné) au moment où cette migration a été
-- écrite, avec un backfill 1:1 depuis agenda_public déjà en place pour
-- tous les profils existants. Documentée ici pour que l'historique de
-- migrations reflète l'état réel de la base.
--
-- Décision produit (2026-08-14) : presentation_statut devient la seule
-- source de vérité pour la visibilité publique dans l'Annuaire, distincte
-- de agenda_public (qui reste dédié à la réservation en ligne côté
-- ProfilPage.jsx). Un praticien peut donc désormais avoir sa présentation
-- publiée sans agenda de réservation actif, ou l'inverse.

alter table profiles
  add column if not exists presentation_statut text default 'brouillon'
    check (presentation_statut in ('brouillon', 'publie'));
