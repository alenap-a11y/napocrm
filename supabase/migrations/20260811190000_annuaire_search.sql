-- Espace client Naposolo — étape 6/12 : colonnes annuaire sur profiles +
-- recherche floue pg_trgm (déjà activé en base, cf. 20260620120000).

alter table profiles
  add column if not exists pays text,
  add column if not exists langues text[] not null default '{}',
  add column if not exists types_prestation text[] not null default '{}', -- 'en_live','replay','formation','atelier','seminaire'
  add column if not exists note_moyenne numeric,
  add column if not exists nombre_avis integer,
  add column if not exists musiques text[] not null default '{}',
  add column if not exists livres text[] not null default '{}',
  add column if not exists recettes text[] not null default '{}';

-- array_to_string() et le cast text[]::text sont classés STABLE (pas
-- IMMUTABLE) par Postgres, donc interdits dans une colonne générée, bien
-- qu'ils soient en réalité déterministes pour du texte simple sans
-- dépendance de locale. Wrapper IMMUTABLE, pattern standard pour ce cas.
create or replace function public.immutable_array_to_string(arr text[], sep text)
returns text
language sql
immutable
as $$ select array_to_string(arr, sep); $$;

-- Colonne générée regroupant titre + description + tags, pour que la
-- tolérance aux fautes de frappe porte sur l'ensemble (pas seulement le
-- nom) — cf. brief : "sinon la tolérance aux fautes de frappe ne sert à rien".
alter table profiles
  add column if not exists search_text text generated always as (
    coalesce(metier, '') || ' ' || coalesce(activite, '') || ' ' ||
    coalesce(bio, '') || ' ' || coalesce(public.immutable_array_to_string(specialites, ' '), '')
  ) stored;

create index if not exists idx_profiles_search_trgm on profiles using gin (search_text gin_trgm_ops);

-- Recherche floue basique : opérateur de similarité trigram (%), pas de
-- synonymes ni de sémantique. Limité aux profils à agenda public (seuls
-- lisibles par un compte client_portail sous la policy existante
-- agenda_public_anon_select) et aux comptes non-admin. Ne renvoie que les
-- colonnes nécessaires à la carte praticien — pas de select *, pour ne pas
-- exposer tel/tel_urgence/siret/admin_notes/email même si la RLS
-- sous-jacente les autoriserait déjà pour ces lignes publiques.
create or replace function public.search_praticiens(query text)
returns table (
  id uuid, prenom text, nom text, avatar_url text, metier text, activite text,
  bio text, ville text, pays text, langues text[], specialites text[],
  types_prestation text[], note_moyenne numeric, nombre_avis integer,
  musiques text[], livres text[], recettes text[], slug text
)
language sql
stable
as $$
  select
    p.id, p.prenom, p.nom, p.avatar_url, p.metier, p.activite,
    p.bio, p.ville, p.pays, p.langues, p.specialites,
    p.types_prestation, p.note_moyenne, p.nombre_avis,
    p.musiques, p.livres, p.recettes, p.slug
  from profiles p
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
