-- Napo-Live V1 : salle Jitsi privée par séance Oracle. Le nom de salle EST la
-- protection (meet.jit.si n'a pas d'authentification) — d'où l'UUID généré
-- côté DB plutôt qu'un identifiant prévisible (slug praticien, nom client, date).
-- Cible napo_oracle_seances (et non la table générique seances) : c'est la table
-- réellement lue/écrite par NapoOracleSéance.jsx.

alter table napo_oracle_seances add column jitsi_room_id uuid default gen_random_uuid();
