-- Réservation/annulation de RDV depuis l'espace client, en réutilisant
-- AgendaPublic.jsx (point d'entrée : bouton "Prendre rendez-vous" sur
-- ClientPraticienDetail.jsx, cf. cadrage du 15/08/2026).
--
-- Reconnaissance préalable (pg_policies live, via `supabase db query
-- --linked`) a invalidé l'hypothèse initiale du cadrage : seances.client_id
-- n'est PAS auth.uid(), c'est une FK vers clients(id) — la fiche CRM interne
-- du praticien. Le mécanisme réel de rattachement client_portail → seances,
-- déjà en place (policy "client portail lit ses seances par email",
-- 20260811180000), passe par un matching sur l'email via la table clients.
-- On reste cohérent avec ce mécanisme plutôt que d'en introduire un second.

-- Résout (ou crée) la fiche clients du praticien correspondant à l'email
-- d'une session clients_portail, pour pouvoir renseigner seances.client_id
-- lors d'une réservation authentifiée. SECURITY DEFINER nécessaire : la
-- table clients n'a pas de policy INSERT pour clients_portail (seulement
-- SELECT par email, 20260811180000) — un client ne peut pas créer sa propre
-- fiche chez un praticien qu'il n'a jamais consulté. Le contrôle d'email
-- (auth.uid() doit posséder p_email) empêche un client connecté de
-- rattacher/créer une fiche sous l'email de quelqu'un d'autre.
create or replace function public.get_or_create_client_portail(
  p_praticien_id uuid, p_email text, p_prenom text, p_nom text, p_telephone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
begin
  if not exists (
    select 1 from clients_portail
    where id = auth.uid() and lower(email) = lower(p_email)
  ) then
    raise exception 'email non autorisé pour cette session';
  end if;

  select id into v_client_id from clients
  where user_id = p_praticien_id and lower(email) = lower(p_email)
  limit 1;

  if v_client_id is null then
    insert into clients (user_id, prenom, nom, email, telephone)
    values (p_praticien_id, p_prenom, p_nom, p_email, p_telephone)
    returning id into v_client_id;
  end if;

  return v_client_id;
end;
$$;

grant execute on function public.get_or_create_client_portail(uuid, text, text, text, text) to authenticated;

-- Annulation par le client de sa propre séance : même matching par email
-- que la policy de lecture (20260811180000), symétrique en écriture.
-- with_check limite le changement au seul statut → 'annulé' (pas de date,
-- praticien, ou repassage annulé → confirmé côté client).
create policy "client portail annule sa seance" on seances
  for update
  using (
    client_id in (
      select id from clients
      where lower(email) = lower((select email from clients_portail where id = (select auth.uid())))
    )
  )
  with check (
    client_id in (
      select id from clients
      where lower(email) = lower((select email from clients_portail where id = (select auth.uid())))
    )
    and statut = 'annulé'
  );
