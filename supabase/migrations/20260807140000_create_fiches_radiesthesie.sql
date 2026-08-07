-- Module Napo-Radiesthésie : même pattern fiche + sous-table répétable que
-- Napo-Médium (fiches_mediumnite / fiches_mediumnite_perceptions), adapté à une
-- séquence de questions posées au pendule/baguettes plutôt qu'à des perceptions.
-- Hors scope V1 (explicite) : tout support cartographique (géobiologie, recherche
-- de lieu avec coordonnées) — non modélisé ici, à ne pas ajouter sans demande.

create table fiches_radiesthesie (
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

create table fiches_radiesthesie_questions (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid references fiches_radiesthesie(id) on delete cascade,
  user_id uuid references auth.users(id),
  objet_recherche text,
  question text,
  reponse_type text,
  reponse_intensite integer check (reponse_intensite between 0 and 8),
  created_at timestamp with time zone default now()
);

alter table fiches_radiesthesie enable row level security;
alter table fiches_radiesthesie_questions enable row level security;

create policy "user isolé fiches_radiesthesie" on fiches_radiesthesie
  for all using (auth.uid() = user_id);

create policy "user isolé fiches_radiesthesie_questions" on fiches_radiesthesie_questions
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Radiesthésie',
  'Séances de radiesthésie — questions posées au pendule, baguettes ou antenne de Lecher',
  'Napo-Métiers',
  'ti-pendulum',
  'available',
  'Activer',
  8,
  null
);
