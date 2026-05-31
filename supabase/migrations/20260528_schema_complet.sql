-- ════════════════════════════════════════════
-- NAPOCRM — Script SQL complet
-- Coller dans Supabase SQL Editor
-- ════════════════════════════════════════════

-- ─── CLIENTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prenom      text NOT NULL,
  nom         text NOT NULL,
  email       text,
  telephone   text,
  metier      text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_own" ON clients
  USING (auth.uid() = user_id);

-- ─── SEANCES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS seances (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  type_seance   text,
  date          date NOT NULL,
  heure         time,
  duree         int DEFAULT 60,
  prix          numeric(10,2),
  notes         text,
  statut        text DEFAULT 'planifiee',
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE seances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seances_own" ON seances
  USING (auth.uid() = user_id);

-- ─── AGENDA ──────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seance_id     uuid REFERENCES seances(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  titre         text NOT NULL,
  date          date NOT NULL,
  heure_debut   time,
  heure_fin     time,
  type_event    text DEFAULT 'seance',
  couleur       text,
  rappel        boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agenda_own" ON agenda
  USING (auth.uid() = user_id);

-- ─── NOTES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seance_id     uuid REFERENCES seances(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  contenu       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_own" ON notes
  USING (auth.uid() = user_id);

-- ─── TACHES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS taches (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  titre         text NOT NULL,
  description   text,
  statut        text DEFAULT 'a_faire',
  priorite      text DEFAULT 'normale',
  echeance      date,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taches_own" ON taches
  USING (auth.uid() = user_id);

-- ─── FLEURS DE BACH ──────────────────────────
CREATE TABLE IF NOT EXISTS fleurs_bach (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  seance_id     uuid REFERENCES seances(id) ON DELETE SET NULL,
  fleurs        text[],
  intention     text,
  posologie     text,
  date_tirage   date DEFAULT now(),
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE fleurs_bach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fleurs_own" ON fleurs_bach
  USING (auth.uid() = user_id);

-- ─── BOARD COLONNES ──────────────────────────
CREATE TABLE IF NOT EXISTS board_colonnes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titre         text NOT NULL,
  position      int DEFAULT 0,
  couleur       text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE board_colonnes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colonnes_own" ON board_colonnes
  USING (auth.uid() = user_id);

-- ─── BOARD CARDS ─────────────────────────────
CREATE TABLE IF NOT EXISTS board_cards (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  colonne_id    uuid REFERENCES board_colonnes(id) ON DELETE CASCADE NOT NULL,
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  titre         text NOT NULL,
  description   text,
  position      int DEFAULT 0,
  etiquette     text,
  echeance      date,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE board_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_own" ON board_cards
  USING (auth.uid() = user_id);

-- ─── INDEX ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_user    ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_seances_user    ON seances(user_id);
CREATE INDEX IF NOT EXISTS idx_seances_client  ON seances(client_id);
CREATE INDEX IF NOT EXISTS idx_seances_date    ON seances(date);
CREATE INDEX IF NOT EXISTS idx_agenda_user     ON agenda(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_date     ON agenda(date);
CREATE INDEX IF NOT EXISTS idx_notes_seance    ON notes(seance_id);
CREATE INDEX IF NOT EXISTS idx_taches_user     ON taches(user_id);
CREATE INDEX IF NOT EXISTS idx_fleurs_client   ON fleurs_bach(client_id);
CREATE INDEX IF NOT EXISTS idx_cards_colonne   ON board_cards(colonne_id);
