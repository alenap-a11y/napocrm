-- Page de détail public du praticien — fichier créé rétroactivement.
-- Ces trois objets étaient déjà appliqués en base (hors pipeline versionné)
-- au moment où cette migration a été écrite : documentés ici pour que
-- l'historique reflète l'état réel, cf. NAPOSOLO_MODULE_METHOD.md
-- (section "Présentation praticien détail" — réflexe pg_get_functiondef
-- avant tout commit touchant du SQL déjà en prod).

-- Lecture publique d'un profil publié, par anon (visite non connectée) et
-- authenticated (client connecté) — nécessaire à search_praticiens() et
-- get_praticien_detail(), ni l'une ni l'autre n'étant SECURITY DEFINER.
drop policy if exists "presentation_publique_select" on profiles;
create policy "presentation_publique_select" on profiles
  for select to anon, authenticated
  using (presentation_statut = 'publie');

-- SIRET inclus délibérément ici (contrairement à search_praticiens()) :
-- affiché sous "Mentions légales" sur la fiche détail, jamais dans les
-- résultats de recherche en liste.
create or replace function public.get_praticien_detail(p_slug text)
returns table (
  id uuid, prenom text, nom text, avatar_url text, metier text, activite text,
  bio text, ville text, pays text, langues text[], specialites text[],
  types_prestation text[], note_moyenne numeric, nombre_avis integer,
  musiques text[], livres text[], recettes text[], slug text,
  anciennete_depuis date, siret text,
  parcours text, formations text[], tarif_indicatif text,
  tel_pro text, email_pro text,
  films_series text[], passions text[], animal text, petit_plaisir text,
  endroit_prefere text, cote_decale text, phrase_representative text,
  choses_insolites text[]
)
language sql
stable
as $$
  select
    p.id, p.prenom, p.nom, p.avatar_url, p.metier, p.activite,
    p.bio, p.ville, p.pays, p.langues, p.specialites,
    p.types_prestation, p.note_moyenne, p.nombre_avis,
    p.musiques, p.livres, p.recettes, p.slug,
    p.anciennete_depuis, p.siret,
    p.parcours, p.formations, p.tarif_indicatif,
    p.tel_pro, p.email_pro,
    p.films_series, p.passions, p.animal, p.petit_plaisir,
    p.endroit_prefere, p.cote_decale, p.phrase_representative,
    p.choses_insolites
  from profiles p
  where p.slug = p_slug and p.presentation_statut = 'publie'
$$;

-- Helper préparatoire pour une future section ACTIVITÉS (non branchée à
-- aucune UI pour l'instant — décision produit non tranchée, cf.
-- NAPOSOLO_MODULE_METHOD.md). Unit offres_praticien + evenements pour un
-- praticien donné. Documenté ici par simple hygiène, pas de changement de
-- comportement.
create or replace function public.get_activites_praticien(p_praticien_id uuid)
returns table (
  source text, titre text, type text, date_prevue timestamptz, lien_externe text
)
language sql
stable
as $$
  select 'offre', type, null, date_prevue::timestamptz, null from offres_praticien where user_id = p_praticien_id
  union all
  select 'evenement', titre, type, date_debut, lien_externe from evenements where praticien_id = p_praticien_id
  order by 4 nulls last;
$$;
