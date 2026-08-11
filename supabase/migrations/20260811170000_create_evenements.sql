-- Espace client Naposolo — étape 4/12 : table evenements, créée en avance
-- sur l'étape 7 ("Écran Événements") car le bloc "Suggéré pour vous" de
-- l'Accueil en a besoin dès maintenant pour filtrer sur les préférences
-- client. L'étape 7 se concentrera alors uniquement sur l'écran de
-- recherche/liste, la table existant déjà.
--
-- Pas d'UI de création côté praticien dans ce chantier (hors scope du brief
-- espace client) — la table reste vide tant qu'aucun contenu n'est créé
-- manuellement, ce qui est attendu : le bloc suggestions se masque
-- simplement s'il n'y a rien à afficher (cf. convention déjà suivie pour
-- les badges/compteurs vides des cartes praticien).
create table evenements (
  id uuid primary key default gen_random_uuid(),
  praticien_id uuid references auth.users(id) on delete cascade,
  titre text not null,
  description text,
  type text check (type in ('atelier', 'formation', 'ceremonie', 'stage', 'replay')),
  tags text[] not null default '{}',
  format text check (format in ('en_ligne', 'presentiel')),
  pays text,
  langue text,
  prix numeric,
  lien_externe text,
  date_debut timestamptz,
  date_fin timestamptz,
  created_at timestamptz not null default now()
);

alter table evenements enable row level security;

-- Lecture publique (vitrine, comme les profils praticiens à agenda public).
create policy "lecture publique evenements" on evenements
  for select using (true);

create policy "praticien gère ses evenements" on evenements
  for all using ((select auth.uid()) = praticien_id);
