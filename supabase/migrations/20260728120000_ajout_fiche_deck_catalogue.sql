-- Ajout d'un champ texte libre pour la fiche descriptive d'un oracle
-- (createur, annee, description, domaines de consultation, mots-cles...)
-- affichee a cote de la liste des cartes, texte libre plutot que champs
-- structures pour l'instant (phase de test sur peu d'oracles).

ALTER TABLE public.napo_oracle_decks_catalogue 
  ADD COLUMN IF NOT EXISTS fiche text;
