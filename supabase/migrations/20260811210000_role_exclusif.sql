-- Espace client Naposolo — correctifs avant push : rôle exclusif
-- (un email = client OU praticien, jamais les deux).

-- RPC de pré-vérification à l'inscription : indique si un email existe déjà
-- et sous quel rôle, sans exposer d'autre donnée (pas de select *, juste un
-- statut). SECURITY DEFINER car auth.users et clients_portail ne sont pas
-- lisibles par un utilisateur anonyme sous RLS normale.
create or replace function public.check_email_role(check_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  select id into found_id from auth.users where lower(email) = lower(check_email) limit 1;
  if found_id is null then
    return null; -- email libre
  end if;
  if exists (select 1 from clients_portail where id = found_id) then
    return 'client';
  end if;
  return 'praticien';
end;
$$;

-- Hygiène : create_profile_on_signup (trigger trg_create_profile, préexistant
-- depuis 20260622175546_create_profiles.sql) s'exécute sur TOUT insert dans
-- auth.users, sans filtre — y compris les inscriptions clients_portail. En
-- pratique aucune ligne profiles parasite n'a été observée pour les comptes
-- clients existants (probablement à cause du bloc EXCEPTION WHEN OTHERS qui
-- avale silencieusement une erreur non identifiée), mais on ne veut pas
-- dépendre d'un comportement non expliqué : filtre explicite sur
-- account_type, symétrique à handle_new_client (20260811160000).
create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
as $$
BEGIN
  IF NEW.raw_user_meta_data->>'account_type' = 'client' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles (id, prenom, is_admin)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'prenom',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
