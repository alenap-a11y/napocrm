-- Module Napo-Sophrologie : "réutilise le composant Magnétiseur" = le
-- sélecteur 0-8, appliqué ici en deux valeurs uniques (avant/après sur la
-- séance), pas par zone comme sur fiches_magnetisme_zones.
-- Vigilance légale (positionnement) : à vérifier avant publication marketplace
-- vs. cible BGE ("hors professions réglementées de santé") — pas bloquant
-- pour coder, signalé pour la revue avant mise en avant publique.

create table fiches_sophrologie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  objectif_seance text,
  exercices_pratiques text,
  ressenti_avant integer check (ressenti_avant between 0 and 8),
  ressenti_apres integer check (ressenti_apres between 0 and 8),
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_sophrologie enable row level security;

create policy "user isolé fiches_sophrologie" on fiches_sophrologie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Sophrologie',
  'Séances de sophrologie — objectif, exercices pratiqués, ressenti avant/après',
  'Napo-Métiers',
  'ti-mood-smile',
  'available',
  'Activer',
  14,
  null
);
