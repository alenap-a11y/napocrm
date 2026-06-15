create or replace function create_notification_on_note()
returns trigger as $$
begin
  insert into notifications (user_id, msg, icon, icon_color, bg, unread)
  values (
    new.user_id,
    coalesce(new.titre, left(new.contenu, 60)),
    'ti-notebook',
    '#854F0B',
    '#FAEEDA',
    true
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_notif_note
after insert on notes
for each row execute function create_notification_on_note();
