-- Extension de Napo-Live à tous les modules séance (pas seulement Napo-Oracle) :
-- même principe, salle Jitsi privée par séance via UUID généré côté DB.

alter table energie_seances       add column jitsi_room_id uuid default gen_random_uuid();
alter table fiches_magnetisme     add column jitsi_room_id uuid default gen_random_uuid();
alter table fiches_mediumnite     add column jitsi_room_id uuid default gen_random_uuid();
alter table fiches_radiesthesie   add column jitsi_room_id uuid default gen_random_uuid();
