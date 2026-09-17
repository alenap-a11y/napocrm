-- Un compte admin peut aussi être un praticien publié (cas solo founder).
-- presentation_statut = 'publie' reste la seule garde nécessaire : un
-- compte admin sans présentation ne sera jamais 'publie' par accident.
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
  where p.presentation_statut = 'publie'
    and (
      query = '' or query is null
      or p.search_text ilike '%' || query || '%'
      or p.search_text % query
    )
  order by (case when query = '' or query is null then 0 else similarity(p.search_text, query) end) desc
  limit 30;
$$;
