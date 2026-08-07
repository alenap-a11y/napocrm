-- Module Napo-Chamanisme : fiche simple séance-level. "ressenti_message_recu"
-- reprend l'esprit du champ "contenu reçu" de Médium (nommage cohérent), pas
-- sa structure répétable — le brief ne liste que des champs uniques ici,
-- contrairement aux "plusieurs perceptions distinctes" de fiches_mediumnite.

create table fiches_chamanisme (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  type_pratique text,
  elements_utilises text,
  ressenti_message_recu text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_chamanisme enable row level security;

create policy "user isolé fiches_chamanisme" on fiches_chamanisme
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Chamanisme',
  'Séances de chamanisme — soin ou voyage chamanique, éléments utilisés, ressenti',
  'Napo-Métiers',
  'ti-feather',
  'available',
  'Activer',
  16,
  null
);
