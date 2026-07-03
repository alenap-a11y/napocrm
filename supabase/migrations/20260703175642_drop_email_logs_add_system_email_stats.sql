-- email_logs a ete cree manuellement via SQL Editor le 03/07/2026, hors migration versionnee.
-- Contenait recipient_email + user_id (PII) - abandonne au profit d'un design zero PII.
-- Voir echange Claude du 03/07/2026 pour le detail de l'erreur et du contenu original.

drop table if exists email_logs cascade;

create table system_email_stats (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'signup', 'password_reset', 'prospection',
    'agenda_confirmation', 'deletion_request'
  )),
  created_at timestamptz not null default now()
);

alter table system_email_stats enable row level security;

create policy "admin_select_email_stats" on system_email_stats
  for select using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "anyone_insert_email_stats" on system_email_stats
  for insert with check (true);
