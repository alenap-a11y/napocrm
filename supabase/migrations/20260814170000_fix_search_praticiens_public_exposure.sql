-- Corrige deux régressions introduites hors pipeline versionné le 2026-08-14 :
-- 1. search_praticiens() renvoyait p.siret publiquement, alors que la
--    fonction d'origine (20260811190000) excluait explicitement
--    tel/tel_urgence/siret/admin_notes/email du retour public. Aucun code
--    client ne consomme ce champ (vérifié : aucune référence à `siret`
--    dans src/pages/client/) — retrait sans impact fonctionnel.
-- 2. offres_praticien_public_select filtrait sur agenda_public, incohérent
--    avec la bascule de search_praticiens() vers presentation_statut :
--    les offres d'un profil publié via presentation_statut mais avec
--    agenda_public=false restaient invisibles. Alignée sur le même critère.

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
    and coalesce(p.is_admin, false) = false
    and (
      query = '' or query is null
      or p.search_text ilike '%' || query || '%'
      or p.search_text % query
    )
  order by (case when query = '' or query is null then 0 else similarity(p.search_text, query) end) desc
  limit 30;
$$;

drop policy if exists "offres_praticien_public_select" on offres_praticien;
create policy "offres_praticien_public_select" on offres_praticien
  for select to anon
  using (
    exists (select 1 from profiles p where p.id = offres_praticien.user_id and p.presentation_statut = 'publie')
  );
