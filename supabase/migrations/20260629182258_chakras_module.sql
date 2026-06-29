
create table chakra_evaluations (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references clients(id) on delete cascade,
  session_id   uuid references seances(id) on delete cascade,
  session_num  int not null,
  chakra_id    int not null check (chakra_id between 1 and 7),
  niveau       int not null check (niveau between 0 and 100),
  etat         text check (etat in ('bloqué','ouverture','ouvert')),
  notes        text,
  created_at   timestamptz default now()
);

create table suivi_plans (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references clients(id) on delete cascade,
  user_id   uuid references auth.users(id),
  chakras_cibles int[],
  nb_seances     int default 8,
  statut         text default 'actif'
                 check (statut in ('actif','terminé')),
  created_at     timestamptz default now()
);

create table suivi_bilans (
  id               uuid primary key default gen_random_uuid(),
  plan_id          uuid references suivi_plans(id) on delete cascade,
  client_id        uuid references clients(id) on delete cascade,
  type_bilan       text check (type_bilan in ('mi_parcours','final')),
  session_debut    int,
  session_fin      int,
  snapshot_json    jsonb,
  signaux_json     jsonb,
  ajustements_json jsonb,
  notes_praticien  text,
  score_bienetre   numeric(2,1),
  created_at       timestamptz default now()
);

create view chakra_progression as
select
  e.client_id,
  e.chakra_id,
  first_value(e.niveau) over (
    partition by e.client_id, e.chakra_id
    order by e.session_num
  ) as niveau_initial,
  e.niveau as niveau_actuel,
  e.session_num,
  e.niveau - first_value(e.niveau) over (
    partition by e.client_id, e.chakra_id
    order by e.session_num
  ) as delta
from chakra_evaluations e;

-- RLS
alter table chakra_evaluations enable row level security;
alter table suivi_plans enable row level security;
alter table suivi_bilans enable row level security;

create policy "praticien voit ses données" on chakra_evaluations
  for all using (
    client_id in (
      select id from clients where user_id = auth.uid()
    )
  );

create policy "praticien voit ses plans" on suivi_plans
  for all using (user_id = auth.uid());

create policy "praticien voit ses bilans" on suivi_bilans
  for all using (
    client_id in (
      select id from clients where user_id = auth.uid()
    )
  );
