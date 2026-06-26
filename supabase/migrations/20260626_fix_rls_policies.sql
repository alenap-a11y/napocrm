-- Fix RLS policies - 26 juin 2026
DROP POLICY IF EXISTS "lecture publique seances disponibles" ON seances;
DROP POLICY IF EXISTS "lecture seances disponibles public" ON seances;

ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disponibilites_owner" ON disponibilites
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "booking_public_read_dispo" ON disponibilites
FOR SELECT USING (actif = true);
