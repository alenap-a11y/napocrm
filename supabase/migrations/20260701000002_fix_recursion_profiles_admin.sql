-- Fix récursion RLS 42P17 sur profiles_admin_select et profiles_admin_delete
-- Documente aussi is_admin() préexistante, jamais versionnée avant ce jour

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin_user());
