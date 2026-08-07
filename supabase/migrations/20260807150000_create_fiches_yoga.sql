-- Module Napo-Yoga : fiche simple séance-level, pas de sous-table répétable
-- (aucun champ du brief n'indique une structure "plusieurs items par séance").

create table fiches_yoga (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  type_seance text,
  postures_exercices text,
  ressenti text,
  notes_suivi text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_yoga enable row level security;

create policy "user isolé fiches_yoga" on fiches_yoga
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Yoga',
  'Séances de yoga — postures travaillées, ressenti, suivi de progression',
  'Napo-Métiers',
  'ti-yoga',
  'available',
  'Activer',
  9,
  null
);
