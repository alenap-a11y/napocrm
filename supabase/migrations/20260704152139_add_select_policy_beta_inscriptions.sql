create policy "admin_select_beta_inscriptions" on beta_inscriptions
  for select using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));
