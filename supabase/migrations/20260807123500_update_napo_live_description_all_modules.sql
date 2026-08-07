-- Napo-Live étendu à tous les modules séance (Oracle, Énergie, Magnétisme,
-- Médium, Radiesthésie) — la description initiale mentionnait Oracle uniquement.

update marketplace_modules
set description = 'Visio en direct pendant une séance (meet.jit.si, salle privée par séance) — disponible sur tous les modules séance'
where title = 'Napo-Live';
