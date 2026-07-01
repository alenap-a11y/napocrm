DROP POLICY IF EXISTS "agenda_public_anon_select" ON public.profiles;
-- Policy créée manuellement le 30/06 dans SQL Editor, versionnée a posteriori
CREATE POLICY "agenda_public_anon_select" ON public.profiles
FOR SELECT TO anon
USING (agenda_public = true);
