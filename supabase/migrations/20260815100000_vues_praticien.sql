-- Compteur de vues sur la fiche Présentation d'un praticien, affiché sur
-- la carte Annuaire (icône œil, coin haut-droit) — nombre de personnes
-- ayant consulté le profil.

alter table profiles
  add column if not exists nombre_vues integer not null default 0;

-- Incrément public via RPC (pas d'update direct autorisé par RLS sur
-- profiles pour anon/authenticated) : SECURITY DEFINER limité à ce seul
-- compteur, sur un profil publié uniquement.
create or replace function public.increment_vue_praticien(p_praticien_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles
  set nombre_vues = nombre_vues + 1
  where id = p_praticien_id and presentation_statut = 'publie';
$$;

grant execute on function public.increment_vue_praticien(uuid) to anon, authenticated;

-- search_praticiens() : ajoute nombre_vues au retour, pour l'icône œil sur
-- la carte Annuaire. Reprend la définition de 20260814200000 à l'identique
-- + la nouvelle colonne.
drop function if exists public.search_praticiens(text);

create function public.search_praticiens(query text)
returns table (
  id uuid, prenom text, nom text, avatar_url text, metier text, activite text,
  bio text, ville text, pays text, langues text[], specialites text[],
  types_prestation text[], note_moyenne numeric, nombre_avis integer,
  musiques text[], livres text[], recettes text[], slug text,
  anciennete_depuis date, prochaine_offre_type text, prochaine_offre_date date,
  nombre_vues integer
)
language sql
stable
as $$
  select
    p.id, p.prenom, p.nom, p.avatar_url, p.metier, p.activite,
    p.bio, p.ville, p.pays, p.langues, p.specialites,
    p.types_prestation, p.note_moyenne, p.nombre_avis,
    p.musiques, p.livres, p.recettes, p.slug,
    p.anciennete_depuis, o.type, o.date_prevue,
    p.nombre_vues
  from profiles p
  left join lateral (
    select type, date_prevue from offres_praticien
    where user_id = p.id and date_prevue >= current_date
    order by date_prevue asc
    limit 1
  ) o on true
  where p.presentation_statut = 'publie'
    and coalesce(p.is_admin, false) = false
    and (
      query = '' or query is null
      or p.search_text ilike '%' || query || '%'
      or p.search_text % query
    )
  order by (case when query = '' or query is null then 0 else similarity(p.search_text, query) end) desc
  limit 30;
$$;
