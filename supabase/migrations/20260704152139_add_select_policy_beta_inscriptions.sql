-- Policy deja creee manuellement le 04/07/2026 dans le SQL Editor.
-- Ce fichier documente l'action a posteriori ; ne recree rien pour eviter une erreur "already exists".
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'beta_inscriptions' and policyname = 'admin_select_beta_inscriptions'
  ) then
    execute 'create policy "admin_select_beta_inscriptions" on beta_inscriptions for select using (exists (select 1 from profiles where id = auth.uid() and role = ''admin''))';
  end if;
end $$;
