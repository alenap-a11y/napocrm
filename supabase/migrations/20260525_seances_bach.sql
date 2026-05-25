create table if not exists public.seances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date_seance date not null default current_date,
  type_seance text default '1ère séance',
  motif text,
  etats_coches text[],
  fleurs text[],
  score_bien_etre integer check (score_bien_etre between 1 and 10),
  notes text,
  created_at timestamptz default now()
);

alter table public.seances enable row level security;

create policy "Praticien voit ses séances"
  on public.seances for all
  using (auth.uid() = (select user_id from public.clients where id = client_id));
