-- ============================================================
-- CORRECTION SECURITE : Propager is_admin_user() à TOUTES les tables admin
-- Date : 15/07/2026
-- ============================================================

-- 1. aide
DROP POLICY IF EXISTS "aide_all_admin" ON public.aide;
CREATE POLICY "aide_all_admin" ON public.aide FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 2. faq
DROP POLICY IF EXISTS "faq_all_admin" ON public.faq;
CREATE POLICY "faq_all_admin" ON public.faq FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 3. news
DROP POLICY IF EXISTS "news_all_admin" ON public.news;
CREATE POLICY "news_all_admin" ON public.news FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 4. app_config
DROP POLICY IF EXISTS "Écriture admin seulement" ON public.app_config;
CREATE POLICY "Écriture admin seulement" ON public.app_config FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 5. landing_content
DROP POLICY IF EXISTS "Admin write" ON public.landing_content;
CREATE POLICY "Admin write" ON public.landing_content FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 6. landing_features
DROP POLICY IF EXISTS "Admin write" ON public.landing_features;
CREATE POLICY "Admin write" ON public.landing_features FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 7. roadmap
DROP POLICY IF EXISTS "admin roadmap" ON public.roadmap;
CREATE POLICY "admin roadmap" ON public.roadmap FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 8. marketplace_modules
DROP POLICY IF EXISTS "Admin only marketplace" ON public.marketplace_modules;
CREATE POLICY "Admin only marketplace" ON public.marketplace_modules FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 9. napoplus_modules
DROP POLICY IF EXISTS "Admin only napoplus" ON public.napoplus_modules;
CREATE POLICY "Admin only napoplus" ON public.napoplus_modules FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 10. onboarding_items
DROP POLICY IF EXISTS "admin only" ON public.onboarding_items;
CREATE POLICY "admin only" ON public.onboarding_items FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());