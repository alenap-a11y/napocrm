ALTER TABLE public.marketplace_modules 
  ADD COLUMN IF NOT EXISTS catalogue_deck_id uuid REFERENCES public.napo_oracle_decks_catalogue(id),
  ADD COLUMN IF NOT EXISTS catalogue_theme_id uuid REFERENCES public.napo_oracle_themes_catalogue(id);

UPDATE public.marketplace_modules 
SET catalogue_deck_id = (SELECT id FROM public.napo_oracle_decks_catalogue WHERE nom = 'Oracle Belline')
WHERE title = 'Oracle Belline';

UPDATE public.marketplace_modules 
SET catalogue_theme_id = (SELECT id FROM public.napo_oracle_themes_catalogue WHERE nom = 'Développement personnel et Spiritualité')
WHERE title = 'Développement personnel et Spiritualité';
