-- Table CMS pour la grille "Un module pour chaque pratique" de la landing page
create table if not exists public.landing_modules (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '✨',
  title text not null,
  description text,
  badge text,
  ordre integer not null default 99,
  created_at timestamptz not null default now()
);

alter table public.landing_modules enable row level security;

drop policy if exists "Public read" on public.landing_modules;
create policy "Public read" on public.landing_modules for select to public using (true);

drop policy if exists "Admin write" on public.landing_modules;
create policy "Admin write" on public.landing_modules for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

-- Seed avec le contenu actuellement codé en dur dans Landing.jsx (idempotent)
insert into public.landing_modules (emoji, title, description, badge, ordre)
select * from (values
  ('⚡', 'NapoÉnergie',        'Magnétisme & soins énergétiques',  null,          1),
  ('🌸', 'Fleurs de Bach',     'Élixirs floraux & suivi',          null,          2),
  ('🔮', 'NapoOracle',         'Cartomancie & tirages',             null,          3),
  ('📹', 'Napo-live',          'Séances en visio intégrées',        null,          4),
  ('🌐', 'Napo-landing',       'Page pro & présentation',           'En cours',    5),
  ('📇', 'Napo-annuaire',      'Trouvez un praticien',              'En cours',    6),
  ('📅', 'Napo-Événement',     'Ateliers & formations',             'En cours',    7),
  ('🌍', 'Napo-live traduction','Traduction en temps réel',         'En création', 8)
) as seed(emoji, title, description, badge, ordre)
where not exists (select 1 from public.landing_modules);

-- Textes de section (idempotent, ne touche pas aux valeurs déjà éditées en admin)
insert into public.landing_content (key, value, color, font_size, font_family)
values
  ('modules_title', 'Un module pour chaque pratique', '#111827', '16px', 'inherit'),
  ('modules_sub', E'Choisissez les modules adaptés à votre métier — magnétisme, yoga, sophrologie, astrologie et bien d''autres. Activez uniquement ce dont vous avez besoin.', '#111827', '16px', 'inherit')
on conflict (key) do nothing;
