-- Table modules Napo+
create table if not exists napoplus_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  icon text,
  icon_bg text,
  icon_color text,
  category_color text,
  category_bg text,
  status text default 'available', -- active | available | soon
  cta text default 'Bientôt disponible',
  path text,
  position integer default 0,
  visible boolean default true,
  created_at timestamptz default now()
);

-- Table modules Marketplace
create table if not exists marketplace_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  icon text,
  icon_bg text,
  icon_color text,
  status text default 'available',
  cta text default 'Bientôt disponible',
  position integer default 0,
  visible boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table napoplus_modules enable row level security;
alter table marketplace_modules enable row level security;

create policy "Admin only napoplus" on napoplus_modules for all using (true);
create policy "Admin only marketplace" on marketplace_modules for all using (true);
