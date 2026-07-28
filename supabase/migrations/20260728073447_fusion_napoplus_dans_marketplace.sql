-- 1. Ajouter les colonnes manquantes à marketplace_modules
ALTER TABLE public.marketplace_modules 
  ADD COLUMN IF NOT EXISTS category_color text,
  ADD COLUMN IF NOT EXISTS category_bg text,
  ADD COLUMN IF NOT EXISTS path text;

-- 2. Copier les données de napoplus_modules dans marketplace_modules
INSERT INTO public.marketplace_modules 
  (id, title, description, category, icon, icon_bg, icon_color, 
   category_color, category_bg, status, cta, path, position, visible, created_at)
SELECT 
  id, title, description, category, icon, icon_bg, icon_color, 
  category_color, category_bg, status, cta, path, position, visible, created_at
FROM public.napoplus_modules
ON CONFLICT (id) DO NOTHING;

-- 3. Backup au lieu de suppression directe — filet de sécurité
ALTER TABLE public.napoplus_modules RENAME TO napoplus_modules_backup_a_supprimer;