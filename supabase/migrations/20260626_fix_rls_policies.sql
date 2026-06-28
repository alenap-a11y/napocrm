-- Fix RLS policies - 26 juin 2026
DROP POLICY IF EXISTS "lecture publique seances disponibles" ON seances;
DROP POLICY IF EXISTS "lecture seances disponibles public" ON seances;

ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disponibilites_owner" ON disponibilites;
DROP POLICY IF EXISTS "disponibilites_owner" ON disponibilites;
CREATE POLICY "disponibilites_owner" ON disponibilites
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "booking_public_read_dispo" ON disponibilites;
CREATE POLICY "booking_public_read_dispo" ON disponibilites
FOR SELECT USING (actif = true);
