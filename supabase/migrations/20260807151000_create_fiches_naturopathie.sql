-- Module Napo-Naturopathie : fiche simple séance-level, pas de sous-table
-- répétable (aucun champ du brief n'indique une structure "plusieurs items").

create table fiches_naturopathie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  motif_consultation text,
  habitudes_alimentaires text,
  recommandations text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_naturopathie enable row level security;

create policy "user isolé fiches_naturopathie" on fiches_naturopathie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Naturopathie',
  'Séances de naturopathie — habitudes alimentaires, recommandations hygiène de vie',
  'Napo-Métiers',
  'ti-plant-2',
  'available',
  'Activer',
  10,
  null
);
