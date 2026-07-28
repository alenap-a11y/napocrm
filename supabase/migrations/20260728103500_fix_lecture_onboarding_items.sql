-- onboarding_items alimente WelcomeModal.jsx, affiche a tout nouveau praticien.
-- L'ancienne policy "admin only" (FOR ALL) bloquait la lecture pour les
-- non-admins -- meme pattern que marketplace_modules. Applique manuellement
-- via SQL editor le 28/07, fichier rendu idempotent pour tracabilite.

DROP POLICY IF EXISTS "admin only" ON public.onboarding_items;
DROP POLICY IF EXISTS "lecture_publique_onboarding" ON public.onboarding_items;
DROP POLICY IF EXISTS "ecriture_admin_onboarding" ON public.onboarding_items;
DROP POLICY IF EXISTS "update_admin_onboarding" ON public.onboarding_items;
DROP POLICY IF EXISTS "delete_admin_onboarding" ON public.onboarding_items;

CREATE POLICY "lecture_publique_onboarding" ON public.onboarding_items 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecriture_admin_onboarding" ON public.onboarding_items 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "update_admin_onboarding" ON public.onboarding_items 
  FOR UPDATE TO authenticated USING (public.is_admin_user());
CREATE POLICY "delete_admin_onboarding" ON public.onboarding_items 
  FOR DELETE TO authenticated USING (public.is_admin_user());
