-- Activation des métiers praticien à l'inscription, sans dépendre de la
-- confirmation email ni d'aucune redirection (abandon de l'insert différé
-- via ConfirmEmail.jsx / activateMetierModule, trop fragile). Trigger
-- SECURITY DEFINER sur auth.users, même pattern que handle_new_client
-- (20260811160000_client_signup_trigger.sql) et create_profile_on_signup
-- (20260622175546_create_profiles.sql) : contourne RLS profil_modules_actifs
-- (auth.uid() = user_id) et se déclenche dès le signUp(), avant toute
-- confirmation. metiers_choisis (tableau d'UUID de marketplace_modules) est
-- déposé dans raw_user_meta_data par Landing.jsx au moment du signUp()
-- (cf. handleBeta).
create or replace function public.handle_new_praticien_modules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(new.raw_user_meta_data->'metiers_choisis') = 'array' then
    insert into public.profil_modules_actifs (user_id, module_id)
    select new.id, value::uuid
    from jsonb_array_elements_text(new.raw_user_meta_data->'metiers_choisis') as value
    on conflict (user_id, module_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_praticien_modules on auth.users;
create trigger on_auth_user_created_praticien_modules
  after insert on auth.users
  for each row execute function public.handle_new_praticien_modules();
