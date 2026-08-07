-- Module Napo-Magnétiseur : réutilise le pattern energie_seances / energie_chakras_mesures,
-- ajoute une mesure avant/après par zone sur échelle 0-8 (absente de NapoÉnergie).

create table fiches_magnetisme (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  outil text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table fiches_magnetisme_zones (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid references fiches_magnetisme(id) on delete cascade,
  user_id uuid references auth.users(id),
  zone_id integer not null,
  mesure_avant integer check (mesure_avant between 0 and 8),
  mesure_apres integer check (mesure_apres between 0 and 8),
  created_at timestamp with time zone default now()
);

alter table fiches_magnetisme enable row level security;
alter table fiches_magnetisme_zones enable row level security;

create policy "user isolé fiches_magnetisme" on fiches_magnetisme
  for all using (auth.uid() = user_id);

create policy "user isolé fiches_magnetisme_zones" on fiches_magnetisme_zones
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Magnétiseur',
  'Séances de magnétisme, mesures avant/après par zone (échelle 0-8)',
  'Napo-Métiers',
  'ti-hand-stop',
  'available',
  'Activer',
  6,
  null
);
