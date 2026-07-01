-- Suppression lecture publique profiles (exposition prenoms testeurs)
DROP POLICY IF EXISTS "lecture publique profiles" ON public.profiles;
-- La création de profiles_admin_select est déplacée dans la migration 20260701000002
