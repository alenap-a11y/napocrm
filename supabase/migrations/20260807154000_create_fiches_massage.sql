-- Module Napo-Massage : fiche simple séance-level. Intensité modélisée en
-- échelle 0-8 unique (pas avant/après comme Magnétiseur — juste "pression/
-- intensité" en une valeur, comme demandé par le brief).
-- Vigilance légale (positionnement) : liste de types volontairement limitée
-- au massage bien-être, pas de type à connotation thérapeutique/médicale.

create table fiches_massage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  type_massage text,
  zones_travaillees text,
  intensite integer check (intensite between 0 and 8),
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_massage enable row level security;

create policy "user isolé fiches_massage" on fiches_massage
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Massage',
  'Séances de massage bien-être — zones travaillées, intensité, bilan',
  'Napo-Métiers',
  'ti-hand-move',
  'available',
  'Activer',
  13,
  null
);
