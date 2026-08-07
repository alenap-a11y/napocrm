-- Module Napo-Médium : réutilise le pattern fiche + sous-table répétable de
-- Napo-Magnétiseur (fiches_magnetisme / fiches_magnetisme_zones). Distinct de
-- NapoOracle : aucun deck de cartes, réception libre.

create table fiches_mediumnite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table fiches_mediumnite_perceptions (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid references fiches_mediumnite(id) on delete cascade,
  user_id uuid references auth.users(id),
  type_perception text,
  contenu text,
  validation_client text,
  created_at timestamp with time zone default now()
);

alter table fiches_mediumnite enable row level security;
alter table fiches_mediumnite_perceptions enable row level security;

create policy "user isolé fiches_mediumnite" on fiches_mediumnite
  for all using (auth.uid() = user_id);

create policy "user isolé fiches_mediumnite_perceptions" on fiches_mediumnite_perceptions
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Médium',
  'Séance de médiumnité — messages, ressentis et images reçus en séance',
  'Napo-Métiers',
  'ti-ghost',
  'available',
  'Activer',
  7,
  null
);
