-- Correction des politiques admin restantes (tables de monitoring)
-- Date : 15/07/2026

DROP POLICY IF EXISTS "admin_select_beta_inscriptions" ON public.beta_inscriptions;
CREATE POLICY "admin_select_beta_inscriptions" ON public.beta_inscriptions FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_select_deletion_log" ON public.deletion_log;
CREATE POLICY "admin_select_deletion_log" ON public.deletion_log FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin voit toutes les fiches bach" ON public.fiches_bach;
CREATE POLICY "admin voit toutes les fiches bach" ON public.fiches_bach FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_select_email_stats" ON public.system_email_stats;
CREATE POLICY "admin_select_email_stats" ON public.system_email_stats FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_read_events" ON public.user_events;
CREATE POLICY "admin_read_events" ON public.user_events FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_read_sessions" ON public.user_sessions;
CREATE POLICY "admin_read_sessions" ON public.user_sessions FOR SELECT TO authenticated USING (public.is_admin_user());