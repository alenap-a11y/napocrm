-- Espace client Naposolo — étape 2/12 : création automatique de la ligne
-- clients_portail à l'inscription. La confirmation email est active sur le
-- projet (mailer_autoconfirm = false), donc signUp() ne renvoie pas de
-- session immédiate : un insert direct depuis le front échouerait sous RLS
-- (auth.uid() = id) avant confirmation. Trigger SECURITY DEFINER sur
-- auth.users, qui contourne RLS et se déclenche dès le signUp (pas besoin
-- d'attendre la confirmation). Filtré sur account_type = 'client' dans les
-- métadonnées pour ne pas capter les inscriptions praticien (même backend
-- auth.users, cf. handleBeta dans Landing.jsx).
create or replace function public.handle_new_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'account_type' = 'client' then
    insert into public.clients_portail (
      id, nom, prenom, age, email, telephone,
      nationalite, adresse_postale, whatsapp, facebook, instagram, preferences,
      consent_rgpd, consent_rgpd_date, consent_sms, consent_sms_date
    )
    values (
      new.id,
      new.raw_user_meta_data->>'nom',
      new.raw_user_meta_data->>'prenom',
      nullif(new.raw_user_meta_data->>'age', '')::integer,
      new.email,
      new.raw_user_meta_data->>'telephone',
      nullif(new.raw_user_meta_data->>'nationalite', ''),
      nullif(new.raw_user_meta_data->>'adresse_postale', ''),
      nullif(new.raw_user_meta_data->>'whatsapp', ''),
      nullif(new.raw_user_meta_data->>'facebook', ''),
      nullif(new.raw_user_meta_data->>'instagram', ''),
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(new.raw_user_meta_data->'preferences')),
        '{}'
      ),
      true, now(),
      true, now()
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_client on auth.users;
create trigger on_auth_user_created_client
  after insert on auth.users
  for each row execute function public.handle_new_client();
