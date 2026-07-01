-- RLS aide / faq / news
ALTER TABLE public.aide ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aide_select_authenticated" ON public.aide;
CREATE POLICY "aide_select_authenticated" ON public.aide FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "aide_all_admin" ON public.aide;
CREATE POLICY "aide_all_admin" ON public.aide FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faq_select_authenticated" ON public.faq;
CREATE POLICY "faq_select_authenticated" ON public.faq FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "faq_all_admin" ON public.faq;
CREATE POLICY "faq_all_admin" ON public.faq FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "news_select_authenticated" ON public.news;
CREATE POLICY "news_select_authenticated" ON public.news FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "news_all_admin" ON public.news;
CREATE POLICY "news_all_admin" ON public.news FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
