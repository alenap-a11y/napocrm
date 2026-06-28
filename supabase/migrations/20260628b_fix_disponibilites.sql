DROP POLICY IF EXISTS "disponibilites_owner" ON disponibilites;
CREATE POLICY "disponibilites_owner" ON disponibilites
FOR ALL USING (auth.uid() = user_id);
