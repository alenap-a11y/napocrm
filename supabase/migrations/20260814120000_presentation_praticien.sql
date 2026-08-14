-- Page "Présentation du praticien" (vitrine) — étape 1/4.
-- Décision : réutiliser les colonnes profiles déjà lues par search_praticiens()
-- (pays, langues, types_prestation, musiques, livres, recettes, specialites,
-- bio, avatar_url, siret, metier, activite) plutôt que dupliquer un modèle
-- presentation_* parallèle. Réutiliser agenda_public comme unique statut de
-- publication (pas de brouillon/publié séparé). Seuls les champs réellement
-- absents sont ajoutés ici.

alter table profiles
  add column if not exists anciennete_depuis date,
  add column if not exists charte_acceptee_le timestamptz,
  add column if not exists aides_services text,
  -- Contrôle a posteriori (modération à l'œil nu, pas de filtrage auto) :
  -- permet à un admin de couper la visibilité publique en gardant une trace
  -- du motif, sans supprimer les données saisies par le praticien.
  add column if not exists desactivation_motif text,
  add column if not exists desactivation_le timestamptz;

-- Offres (lives, formations, séminaires...) : liste à plusieurs lignes avec
-- date prévue, distincte du tag list types_prestation (qui reste utilisé tel
-- quel par la carte Annuaire). Nom aligné sur le pattern existant
-- favoris_client (nom_qualifiant).
create table if not exists offres_praticien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('live', 'formation', 'seminaire', 'meditation', 'atelier')),
  modalite text not null check (modalite in ('presentiel', 'live', 'replay')),
  date_prevue date,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

alter table offres_praticien enable row level security;

-- Même filtre que agenda_public_anon_select sur profiles, pour rester
-- cohérent avec ce que search_praticiens() autorise déjà côté portail client.
create policy "offres_praticien_public_select" on offres_praticien
  for select to anon
  using (
    exists (select 1 from profiles p where p.id = offres_praticien.user_id and p.agenda_public = true)
  );

create policy "offres_praticien_owner_all" on offres_praticien
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_offres_praticien_user_id on offres_praticien(user_id);
