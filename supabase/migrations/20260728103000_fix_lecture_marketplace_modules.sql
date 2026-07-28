-- marketplace_modules doit etre lisible par tout praticien authentifie
-- (catalogue public), mais modifiable seulement par l'admin.
-- L'ancienne policy "Admin only marketplace" (FOR ALL) bloquait la lecture
-- pour les non-admins (vide total constate chez un testeur non-admin).

DROP POLICY IF EXISTS "Admin only marketplace" ON public.marketplace_modules;

CREATE POLICY "lecture_publique_marketplace" ON public.marketplace_modules 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ecriture_admin_marketplace" ON public.marketplace_modules 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "update_admin_marketplace" ON public.marketplace_modules 
  FOR UPDATE TO authenticated USING (public.is_admin_user());
CREATE POLICY "delete_admin_marketplace" ON public.marketplace_modules 
  FOR DELETE TO authenticated USING (public.is_admin_user());
