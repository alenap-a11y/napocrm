-- Module Napo-Astrologie.
-- Vérifié avant de coder : clients.date_naissance existe déjà — pas dupliqué.
-- heure_naissance et lieu_naissance n'existent nulle part (clients.ville est
-- la ville actuelle, pas le lieu de naissance) — ajoutés sur clients plutôt
-- que sur la fiche séance, pour rester la propriété du client et éviter une
-- incohérence si elles étaient ressaisies différemment à chaque séance.

alter table clients add column heure_naissance time without time zone;
alter table clients add column lieu_naissance text;

create table fiches_astrologie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  type_theme text,
  interpretation text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_astrologie enable row level security;

create policy "user isolé fiches_astrologie" on fiches_astrologie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Astrologie',
  'Thèmes astrologiques — natal, transit, synastrie, interprétation',
  'Napo-Métiers',
  'ti-moon-stars',
  'available',
  'Activer',
  17,
  null
);
