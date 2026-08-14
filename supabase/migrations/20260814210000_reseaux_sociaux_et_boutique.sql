-- Page "Présentation du praticien" — réseaux sociaux + Napo-Boutique.

alter table profiles
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists tiktok_url text;

-- Napo-Boutique : produits vendus en direct par le praticien (encens,
-- bougies, oracles...). Vente en dehors de la plateforme (pas de paiement
-- intégré ici — coordonnées de contact déjà présentes via tel_pro/email_pro
-- sur la fiche). RLS calquée sur offres_praticien.
create table if not exists boutique_produits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  description text,
  prix numeric,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

alter table boutique_produits enable row level security;

create policy "boutique_produits_public_select" on boutique_produits
  for select to anon, authenticated
  using (
    exists (select 1 from profiles p where p.id = boutique_produits.user_id and p.presentation_statut = 'publie')
  );

create policy "boutique_produits_owner_all" on boutique_produits
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_boutique_produits_user_id on boutique_produits(user_id);
