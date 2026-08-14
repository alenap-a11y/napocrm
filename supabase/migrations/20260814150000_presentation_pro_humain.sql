-- Page "Présentation du praticien" — sections PRO et HUMAIN.
-- Fichier créé rétroactivement : ces colonnes étaient déjà appliquées en
-- base (hors pipeline versionné, cf. NAPOSOLO_MODULE_METHOD.md §3.7) au
-- moment où ce script a été écrit. Types vérifiés via information_schema
-- avant écriture pour matcher exactement l'état réel de la base.

alter table profiles
  add column if not exists parcours text,
  add column if not exists formations text[] not null default '{}',
  add column if not exists tarif_indicatif text,
  add column if not exists tel_pro text,
  add column if not exists email_pro text,
  add column if not exists films_series text[] not null default '{}',
  add column if not exists passions text[] not null default '{}',
  add column if not exists animal text,
  add column if not exists petit_plaisir text,
  add column if not exists endroit_prefere text,
  add column if not exists cote_decale text,
  add column if not exists phrase_representative text,
  add column if not exists choses_insolites text[] not null default '{}';
