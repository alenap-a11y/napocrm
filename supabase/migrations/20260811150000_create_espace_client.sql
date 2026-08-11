-- Espace client Naposolo (V1) — étape 1/12 : fondations base de données.
-- Comptes clients séparés des comptes praticiens : même backend Supabase Auth
-- (auth.users partagé), mais rôles distingués par table d'appartenance
-- (clients_portail vs profiles), et session isolée côté front via un second
-- client Supabase (storageKey dédiée) — cf. src/lib/supabaseClient.js.

-- ─── Table clients_portail ───────────────────────────────────────────────────
-- Champs obligatoires à l'inscription : nom, prenom, age, email, telephone,
-- consent_rgpd, consent_sms (deux bases légales distinctes — RGPD général vs
-- art. L34-5 CPCE pour la sollicitation SMS/WhatsApp). Le reste est optionnel,
-- réutilisable pour la fiche profil comme profiles.tags/consent_rgpd déjà en
-- base côté praticien. Pas de date de naissance exacte (minimisation RGPD,
-- l'âge suffit).
create table clients_portail (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  age integer,
  email text not null,
  telephone text not null,
  nationalite text,
  adresse_postale text,
  whatsapp text,
  facebook text,
  instagram text,
  preferences text[] not null default '{}',
  consent_rgpd boolean not null default false,
  consent_rgpd_date timestamptz,
  consent_sms boolean not null default false,
  consent_sms_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients_portail enable row level security;

create policy "client isolé clients_portail" on clients_portail
  for all using ((select auth.uid()) = id);

-- ─── Table favoris_client ────────────────────────────────────────────────────
-- Cible polymorphe (praticien ou événement) : pas de FK sur target_id, comme
-- il n'existe pas encore de table événements dédiée (chantier ultérieur de ce
-- même découpage) et pour rester générique aux deux types.
create table favoris_client (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('praticien', 'evenement')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

alter table favoris_client enable row level security;

create policy "client isolé favoris_client" on favoris_client
  for all using ((select auth.uid()) = user_id);

-- ─── Colonne specialites sur profiles ────────────────────────────────────────
-- profiles.tags existe déjà mais sert aux notes internes admin
-- (AdminUserDetail.jsx) — colonne distincte pour les tags métiers publics qui
-- alimenteront la recherche floue de l'annuaire (chantier ultérieur), afin de
-- ne pas mélanger les deux usages.
alter table profiles
  add column if not exists specialites text[] not null default '{}';
