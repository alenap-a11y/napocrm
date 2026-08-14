drop function if exists public.get_praticien_detail(text);

create function public.get_praticien_detail(p_slug text)
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
  choses_insolites text[],
  instagram_url text, facebook_url text, tiktok_url text
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
    p.choses_insolites,
    p.instagram_url, p.facebook_url, p.tiktok_url
  from profiles p
  where p.slug = p_slug and p.presentation_statut = 'publie'
$$;
