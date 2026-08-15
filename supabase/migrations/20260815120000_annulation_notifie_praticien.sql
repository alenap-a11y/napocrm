-- Annulation d'un RDV côté client + notification du praticien.
--
-- ClientSeances.jsx annule via update direct (policy "client portail annule
-- sa seance", 20260815110000) puis insère dans notifications pour prévenir
-- le praticien. Mais notifications n'a qu'une policy "user_own_notifications"
-- (USING (auth.uid() = user_id), pas de with_check séparé donc appliquée
-- aussi à l'INSERT) : un client_portail ne peut insérer que sous son propre
-- auth.uid(), jamais sous celui du praticien. L'insert échouait donc
-- silencieusement (erreur non vérifiée côté front) — vérifié via
-- `supabase db query --linked` sur pg_policies avant d'écrire ce correctif,
-- plutôt que de supposer.
--
-- Correctif : une seule RPC SECURITY DEFINER fait annulation + notification
-- de façon atomique, avec le même contrôle d'accès (email clients_portail
-- ↔ clients) que la policy UPDATE existante. Remplace les deux appels
-- séparés du front.
create or replace function public.annuler_seance_client(p_seance_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_praticien_id uuid;
begin
  update seances
  set statut = 'annulé'
  where id = p_seance_id
    and client_id in (
      select id from clients
      where lower(email) = lower((select email from clients_portail where id = auth.uid()))
    )
  returning user_id into v_praticien_id;

  if v_praticien_id is null then
    raise exception 'séance introuvable ou non autorisée';
  end if;

  insert into notifications (user_id, msg, icon, icon_color, unread)
  values (v_praticien_id, 'Un rendez-vous a été annulé par un client', 'ti-calendar-x', '#C4694A', true);
end;
$$;

grant execute on function public.annuler_seance_client(uuid) to authenticated;
