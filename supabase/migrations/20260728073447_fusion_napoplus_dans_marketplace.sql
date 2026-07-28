-- Fusion napoplus_modules -> marketplace_modules
-- Executee manuellement via SQL editor le 28/07/2026 (napoplus_modules etait vide, rien a migrer)
-- Conserve ici pour tracabilite uniquement, idempotent si rejoue

ALTER TABLE public.marketplace_modules 
  ADD COLUMN IF NOT EXISTS category_color text,
  ADD COLUMN IF NOT EXISTS category_bg text,
  ADD COLUMN IF NOT EXISTS path text;

DROP TABLE IF EXISTS public.napoplus_modules_backup_a_supprimer;
