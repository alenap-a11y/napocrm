-- Espace client Naposolo — étape 5/12 : lecture des séances/fiches client
-- CRM praticien par le compte client_portail, via correspondance sur son
-- email confirmé. Décision validée avec l'utilisateur : matching
-- automatique par email plutôt qu'une table de liaison dédiée, car la
-- confirmation email obligatoire à l'inscription (mailer_autoconfirm=false)
-- prouve déjà la possession de l'adresse.
--
-- Policies additives en lecture seule uniquement (pas de for all) : elles
-- n'élargissent l'accès qu'aux sessions authentifiées comme clients_portail
-- (le sous-select clients_portail retourne NULL pour une session praticien,
-- qui n'a pas de ligne clients_portail — aucun accès supplémentaire accordé
-- aux praticiens existants). Un même client peut ainsi voir ses fiches chez
-- plusieurs praticiens différents s'il partage la même adresse email.

create policy "client portail lit ses fiches clients par email" on clients
  for select using (
    lower(email) = lower((select email from clients_portail where id = (select auth.uid())))
  );

create policy "client portail lit ses seances par email" on seances
  for select using (
    client_id in (
      select id from clients
      where lower(email) = lower((select email from clients_portail where id = (select auth.uid())))
    )
  );
