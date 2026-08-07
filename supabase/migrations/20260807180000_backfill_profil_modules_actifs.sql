-- Backfill nécessaire pour activer le gating sidebar sans casser l'accès
-- existant : "Activer" était un bouton mort jusqu'à il y a deux chantiers,
-- donc aucun praticien n'a jamais eu l'occasion d'"activer" NapoÉnergie,
-- Fleurs de Bach, 3D Humains, NapoOracle ou les modules métiers créés avant
-- le gating — ils y accédaient librement. Sans ce backfill, activer le
-- gating ferait disparaître ces entrées de la sidebar de TOUS les praticiens
-- existants dès le prochain F5, uniquement parce que la table est vide pour
-- eux — pas parce qu'ils ont désactivé quoi que ce soit.
-- Idempotent (ON CONFLICT DO NOTHING) : sans effet sur les lignes déjà
-- présentes (ex. le compte ayant déjà tout activé via le script précédent).

insert into profil_modules_actifs (user_id, module_id)
select p.id, mm.id
from profiles p
cross join marketplace_modules mm
where mm.category = 'Napo-Métiers' and mm.status = 'available'
on conflict (user_id, module_id) do nothing;
