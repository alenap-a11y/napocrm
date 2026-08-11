-- La tentative précédente (20260811220000, revoke update (email)) n'a pas
-- suffi : Supabase accorde UPDATE au niveau table à authenticated (grant
-- par défaut du schéma public), qui prime sur un revoke ciblé colonne par
-- colonne. Trigger BEFORE UPDATE à la place : bloque explicitement tout
-- changement de la valeur d'email, quel que soit le chemin d'appel.
create or replace function public.clients_portail_lock_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'email non modifiable directement';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_portail_lock_email on clients_portail;
create trigger trg_clients_portail_lock_email
  before update on clients_portail
  for each row execute function public.clients_portail_lock_email();
