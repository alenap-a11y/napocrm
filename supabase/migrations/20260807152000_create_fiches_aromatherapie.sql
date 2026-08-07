-- Module Napo-Aromathérapie : fiche simple séance-level. Pas de catalogue
-- d'huiles essentielles existant dans le projet (vérifié — seule mention
-- trouvée : une option de checklist libre dans NouvelleSeanceEnergeticien.jsx,
-- pas une structure réutilisable), donc champ texte libre comme prévu par le
-- brief en absence de catalogue.

create table fiches_aromatherapie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  numero_seance integer default 1,
  date_seance date,
  heure_seance time without time zone,
  motif text,
  huiles_essentielles text,
  mode_application text,
  bilan text,
  duree_minutes integer default 60,
  prix_euros numeric,
  jitsi_room_id uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table fiches_aromatherapie enable row level security;

create policy "user isolé fiches_aromatherapie" on fiches_aromatherapie
  for all using (auth.uid() = user_id);

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Aromathérapie',
  'Séances d''aromathérapie — huiles essentielles utilisées, mode d''application',
  'Napo-Métiers',
  'ti-droplet',
  'available',
  'Activer',
  11,
  null
);
