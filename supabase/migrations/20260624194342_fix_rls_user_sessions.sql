alter table if exists user_sessions enable row level security;

create policy "Users see own sessions" on user_sessions
  for all using (auth.uid() = user_id);
