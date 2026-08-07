-- Module Napo-Sonothérapie : instruments et zones travaillées modélisés en
-- multi-select (text[], comme seances.tags/profiles.tags déjà en base) plutôt
-- qu'une sous-table répétable — le brief ne demande pas de mesure par zone
-- (contrairement à Magnétiseur), juste une liste de zones/instruments.
-- "Zones travaillées" réutilise les 7 noms de chakras de NapoÉnergie/Magnétiseur.

create table fiches_sonotherapie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  instruments_utilises text[] default '{}',
  zones_travaillees text[] default '{}',
  ressenti text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_sonotherapie enable row level security;

create policy "user isolé fiches_sonotherapie" on fiches_sonotherapie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Sonothérapie',
  'Séances de sonothérapie — bols tibétains, gong, diapasons, zones travaillées',
  'Napo-Métiers',
  'ti-wave-sine',
  'available',
  'Activer',
  12,
  null
);
