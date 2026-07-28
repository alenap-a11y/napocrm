-- Insertion catalogue : deck Oracle Belline (52 cartes) + theme Developpement personnel et Spiritualite (20 questions)

WITH nouveau_deck AS (
  INSERT INTO public.napo_oracle_decks_catalogue (nom) VALUES ('Oracle Belline') RETURNING id
)
INSERT INTO public.napo_oracle_cartes_catalogue (deck_id, numero, nom)
SELECT nouveau_deck.id, numero, nom FROM nouveau_deck, (VALUES
  (1, 'La Destinée'),
  (2, 'L''Étoile de l''Homme'),
  (3, 'L''Étoile de la Femme'),
  (4, 'Nativité'),
  (5, 'Réussite'),
  (6, 'Élévation'),
  (7, 'Honneurs'),
  (8, 'Pensée-Amitié'),
  (9, 'Campagne-Santé'),
  (10, 'Présents'),
  (11, 'Trahison'),
  (12, 'Départ'),
  (13, 'Inconstance'),
  (14, 'Découverte'),
  (15, 'L''Eau'),
  (16, 'Les Pénates'),
  (17, 'Maladie'),
  (18, 'Changement'),
  (19, 'Argent'),
  (20, 'Intelligence'),
  (21, 'Vol-Perte'),
  (22, 'Entreprises'),
  (23, 'Trafic'),
  (24, 'Nouvelle'),
  (25, 'Plaisirs'),
  (26, 'La Paix'),
  (27, 'Union'),
  (28, 'Famille'),
  (29, 'Amor'),
  (30, 'La Table'),
  (31, 'Passions'),
  (32, 'Méchanceté'),
  (33, 'Procès'),
  (34, 'Despotisme'),
  (35, 'Ennemis'),
  (36, 'Pourparlers'),
  (37, 'Feu'),
  (38, 'Accident'),
  (39, 'Appui'),
  (40, 'Beauté'),
  (41, 'Héritage'),
  (42, 'Sagesse'),
  (43, 'La Renommée'),
  (44, 'Le Hasard'),
  (45, 'Bonheur'),
  (46, 'Infortune'),
  (47, 'Stérilité'),
  (48, 'Fatalité'),
  (49, 'La Grâce'),
  (50, 'Ruine'),
  (51, 'Retard'),
  (52, 'Cloître')
) AS cartes(numero, nom);

WITH nouveau_theme AS (
  INSERT INTO public.napo_oracle_themes_catalogue (nom) VALUES ('Développement personnel et Spiritualité') RETURNING id
)
INSERT INTO public.napo_oracle_questions_catalogue (theme_id, question)
SELECT nouveau_theme.id, question FROM nouveau_theme, (VALUES
  ('Quelle est la leçon que je dois apprendre ?'),
  ('Quel est mon principal défi actuel ?'),
  ('Quelle qualité dois-je développer ?'),
  ('Quel blocage dois-je dépasser ?'),
  ('Quelle est ma mission de vie actuelle ?'),
  ('Quelle énergie m''accompagne aujourd''hui ?'),
  ('Comment évoluer spirituellement ?'),
  ('Quel message l''Univers souhaite-t-il me transmettre ?'),
  ('Quel est mon potentiel caché ?'),
  ('Comment faire davantage confiance à mon intuition ?'),
  ('Quelle décision est la plus juste ?'),
  ('Quelle porte est prête à s''ouvrir ?'),
  ('Que dois-je laisser derrière moi ?'),
  ('Quelle est ma plus grande force ?'),
  ('Quel conseil l''Oracle me donne-t-il aujourd''hui ?'),
  ('Comment retrouver la paix intérieure ?'),
  ('Quelle transformation est en cours ?'),
  ('Qu''est-ce qui favorise mon évolution ?'),
  ('Quelle opportunité dois-je saisir ?'),
  ('Quel est le meilleur chemin pour avancer ?')
) AS questions(question);
