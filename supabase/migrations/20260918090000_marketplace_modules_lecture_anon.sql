-- Lecture publique de marketplace_modules pour les visiteurs anonymes :
-- l'étape "Choix des métiers" du formulaire d'inscription praticien
-- (Landing.jsx, modale d'inscription) tourne avant la création du compte,
-- donc en contexte anon — la policy existante ("lecture_publique_marketplace",
-- cf. 20260728103000_fix_lecture_marketplace_modules.sql) est TO authenticated
-- uniquement et ne couvre pas ce cas. Même pattern que
-- 20260701000001_agenda_public_anon_select.sql (page /rdv/{slug} publique).
-- Restreint aux lignes visible = true pour ne pas exposer les tuiles masquées
-- (le filtre status = 'available' reste géré côté front, cf. Landing.jsx).
CREATE POLICY "marketplace_modules_anon_select" ON public.marketplace_modules
FOR SELECT TO anon
USING (visible = true);
