-- Page "Présentation du praticien" — étape 3/4 : expose anciennete_depuis
-- et la prochaine offre à venir (table offres_praticien, étape 1) sur la
-- carte Annuaire. Le reste des champs presentation (pays, langues,
-- specialites, musiques, livres, recettes...) est déjà renvoyé par cette
-- fonction depuis la migration 20260811190000 — rien à changer pour eux.

-- Le type de retour change (nouvelles colonnes) : postgres refuse un simple
-- CREATE OR REPLACE dans ce cas (42P13), il faut DROP d'abord.
drop function if exists public.search_praticiens(text);

create function public.search_praticiens(query text)
returns table (
  id uuid, prenom text, nom text, avatar_url text, metier text, activite text,
  bio text, ville text, pays text, langues text[], specialites text[],
  types_prestation text[], note_moyenne numeric, nombre_avis integer,
  musiques text[], livres text[], recettes text[], slug text,
  anciennete_depuis date, prochaine_offre_type text, prochaine_offre_date date
)
language sql
stable
as $$
  select
    p.id, p.prenom, p.nom, p.avatar_url, p.metier, p.activite,
    p.bio, p.ville, p.pays, p.langues, p.specialites,
    p.types_prestation, p.note_moyenne, p.nombre_avis,
    p.musiques, p.livres, p.recettes, p.slug,
    p.anciennete_depuis, o.type, o.date_prevue
  from profiles p
  left join lateral (
    select type, date_prevue from offres_praticien
    where user_id = p.id and date_prevue >= current_date
    order by date_prevue asc
    limit 1
  ) o on true
  where p.agenda_public = true
    and coalesce(p.is_admin, false) = false
    and (
      query = '' or query is null
      or p.search_text ilike '%' || query || '%'
      or p.search_text % query
    )
  order by (case when query = '' or query is null then 0 else similarity(p.search_text, query) end) desc
  limit 30;
$$;
