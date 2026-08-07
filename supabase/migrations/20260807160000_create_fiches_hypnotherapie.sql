-- Module Napo-Hypnothérapie : fiche simple séance-level.
-- Vigilance légale (positionnement, plus marquée que sophrologie) : à
-- vérifier avant publication marketplace — l'hypnothérapie est parfois
-- pratiquée par des professionnels de santé réglementés. Pas bloquant pour
-- coder, signalé pour la revue avant mise en avant publique.

create table fiches_hypnotherapie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  objectif_seance text,
  type_induction text,
  deroulement text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_hypnotherapie enable row level security;

create policy "user isolé fiches_hypnotherapie" on fiches_hypnotherapie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Hypnothérapie',
  'Séances d''hypnothérapie — objectif, induction, déroulement, bilan',
  'Napo-Métiers',
  'ti-spiral',
  'available',
  'Activer',
  15,
  null
);
