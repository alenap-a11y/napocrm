-- Mécanisme d'activation réel pour les tuiles marketplace "Napo-Métiers"
-- (Yoga, Naturopathie, Magnétiseur, etc.) — jusqu'ici le clic "Activer" ne
-- faisait rien (m.path était toujours null, cf. NapoMarketplace.jsx L586).
-- profiles.addons (jsonb) existait déjà en base mais n'était lu/écrit par
-- aucun code — plutôt que de réactiver une colonne morte au format incertain,
-- table de liaison dédiée, cohérente avec le reste du schéma (relationnel,
-- pas de jsonb pour du many-to-many).

create table profil_modules_actifs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  module_id uuid references marketplace_modules(id),
  activated_at timestamp with time zone default now(),
  unique (user_id, module_id)
);

alter table profil_modules_actifs enable row level security;

create policy "user isolé profil_modules_actifs" on profil_modules_actifs
  for all using (auth.uid() = user_id);
