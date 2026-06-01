-- Types énumérés — à exécuter AVANT seances.sql
-- Ajouter une valeur : ALTER TYPE type_seance_enum ADD VALUE 'NouvelleValeur';
-- Supprimer/renommer une valeur nécessite de recréer le type.

DO $$ BEGIN
  CREATE TYPE type_seance_enum AS ENUM (
    'Sophrologie', 'Coaching', 'Naturopathie',
    'Énergie', 'Fleurs de Bach', 'Autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tag_observation AS ENUM (
    'Stress', 'Sommeil', 'Fatigue', 'Anxiété',
    'Douleur', 'Lombaires'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
