-- Tuile marketplace pour Napo-Live V1 (visio uniquement, attachée à Napo-Oracle,
-- pas un métier autonome — d'où la catégorie Napo-Outils / Séance plutôt que
-- Napo-Métiers).

insert into marketplace_modules (title, description, category, icon, status, cta, position, path)
values (
  'Napo-Live',
  'Visio en direct pendant une séance Napo-Oracle (meet.jit.si, salle privée par séance)',
  'Napo-Outils / Séance',
  'ti-video',
  'available',
  'Activer',
  8,
  null
);
