-- Nettoyage marketplace_modules : suppression des tuiles Oracle obsolètes,
-- ajout des vraies tuiles Napo-Métiers / Napo-Outils

DELETE FROM public.marketplace_modules WHERE title IN ('Oracle GÉ', 'Oracle Belline');

INSERT INTO public.marketplace_modules 
  (title, description, category, icon, status, cta, position, visible)
VALUES
  ('NapoÉnergie', 'Séances de magnétisme et soins énergétiques, mesures chakras', 'Napo-Métiers', 'ti-sparkles', 'available', 'Activer', 1, true),
  ('Fleurs de Bach', 'Suivi des fiches Fleurs de Bach', 'Napo-Métiers', 'ti-flower', 'available', 'Activer', 2, true),
  ('3D Humains', 'Module 3D Humains', 'Napo-Métiers', 'ti-cube-3d-sphere', 'available', 'Activer', 3, true),
  ('NapoOracle', 'Tirages de cartes multi-deck et multi-thème', 'Napo-Métiers', 'ti-cards', 'available', 'Activer', 4, true),
  ('NapoCarto', 'Cartomancie et tarot — à venir', 'Napo-Métiers', 'ti-layout-cards', 'coming_soon', 'Bientôt disponible', 5, true),
  ('Symbole Reiki', 'Champ libre autocomplete pour vos symboles Reiki personnels', 'Napo-Outils / Séance', 'ti-yin-yang', 'coming_soon', 'Bientôt disponible', 6, true),
  ('Cartes (addon)', 'Ajoute le tirage de cartes à un métier existant', 'Napo-Outils / Séance', 'ti-cards', 'coming_soon', 'Bientôt disponible', 7, true),
  ('Napo-SMS', 'Rappels de rendez-vous par SMS', 'Napo-Outils / Business', 'ti-message', 'coming_soon', 'Bientôt disponible', 8, true),
  ('Veille concurrentielle', 'Suivi du marché et de la concurrence', 'Napo-Outils / Business', 'ti-radar', 'coming_soon', 'Bientôt disponible', 9, true),
  ('Banque de 400 questions', 'Choisissez 5 questions pour générer vos statistiques', 'Napo-Outils / Business', 'ti-list-numbers', 'coming_soon', 'Bientôt disponible', 10, true),
  ('Signature électronique', 'Signature de documents à distance', 'Napo-Outils / Business', 'ti-signature', 'coming_soon', 'Bientôt disponible', 11, true);
