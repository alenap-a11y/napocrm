-- Espace client Naposolo — étape 7/12 : recherche floue sur evenements,
-- même moteur que search_praticiens (immutable_array_to_string déjà créée
-- en 20260811190000).

alter table evenements
  add column if not exists search_text text generated always as (
    coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' ||
    coalesce(public.immutable_array_to_string(tags, ' '), '')
  ) stored;

create index if not exists idx_evenements_search_trgm on evenements using gin (search_text gin_trgm_ops);

-- evenements est déjà en lecture publique intégrale (policy "lecture
-- publique evenements") : pas de colonnes sensibles à masquer ici,
-- contrairement à profiles — select * est sans risque.
create or replace function public.search_evenements(query text)
returns setof evenements
language sql
stable
as $$
  select *
  from evenements
  where (
    query = '' or query is null
    or search_text ilike '%' || query || '%'
    or search_text % query
  )
  order by
    (case when query = '' or query is null then 0 else similarity(search_text, query) end) desc,
    date_debut asc nulls last
  limit 30;
$$;
