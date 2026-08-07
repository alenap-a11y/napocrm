-- Tarologie : décision prise avec l'utilisateur — pas de 10e module séparé,
-- le tirage tarot est un tirage libre comme NapoOracle le fait déjà
-- génériquement. Ajout du Tarot de Marseille comme deck de plus dans le
-- catalogue Oracle existant (napo_oracle_decks_catalogue), même mécanisme
-- d'activation que les decks déjà en place (Oracle Belline, L'Oracle Gé).

insert into napo_oracle_decks_catalogue (nom, fiche)
values ('Tarot de Marseille', 'Jeu de 78 arcanes traditionnel — 22 arcanes majeurs et 56 arcanes mineurs (Bâtons, Coupes, Épées, Deniers).');

-- Arcanes majeurs (22)
insert into napo_oracle_cartes_catalogue (deck_id, numero, nom)
select id, v.numero, v.nom
from napo_oracle_decks_catalogue, (values
  (0, 'Le Mat'),
  (1, 'Le Bateleur'),
  (2, 'La Papesse'),
  (3, 'L''Impératrice'),
  (4, 'L''Empereur'),
  (5, 'Le Pape'),
  (6, 'L''Amoureux'),
  (7, 'Le Chariot'),
  (8, 'La Justice'),
  (9, 'L''Hermite'),
  (10, 'La Roue de Fortune'),
  (11, 'La Force'),
  (12, 'Le Pendu'),
  (13, 'L''Arcane sans nom'),
  (14, 'Tempérance'),
  (15, 'Le Diable'),
  (16, 'La Maison Dieu'),
  (17, 'L''Étoile'),
  (18, 'La Lune'),
  (19, 'Le Soleil'),
  (20, 'Le Jugement'),
  (21, 'Le Monde')
) as v(numero, nom)
where napo_oracle_decks_catalogue.nom = 'Tarot de Marseille';

-- Arcanes mineurs (56) : 4 couleurs x (As à 10, Valet, Cavalier, Dame, Roi)
insert into napo_oracle_cartes_catalogue (deck_id, numero, nom)
select id, v.numero, v.nom
from napo_oracle_decks_catalogue, (values
  (101, 'As de Bâton'), (102, '2 de Bâton'), (103, '3 de Bâton'), (104, '4 de Bâton'),
  (105, '5 de Bâton'), (106, '6 de Bâton'), (107, '7 de Bâton'), (108, '8 de Bâton'),
  (109, '9 de Bâton'), (110, '10 de Bâton'), (111, 'Valet de Bâton'), (112, 'Cavalier de Bâton'),
  (113, 'Dame de Bâton'), (114, 'Roi de Bâton'),
  (201, 'As de Coupe'), (202, '2 de Coupe'), (203, '3 de Coupe'), (204, '4 de Coupe'),
  (205, '5 de Coupe'), (206, '6 de Coupe'), (207, '7 de Coupe'), (208, '8 de Coupe'),
  (209, '9 de Coupe'), (210, '10 de Coupe'), (211, 'Valet de Coupe'), (212, 'Cavalier de Coupe'),
  (213, 'Dame de Coupe'), (214, 'Roi de Coupe'),
  (301, 'As d''Épée'), (302, '2 d''Épée'), (303, '3 d''Épée'), (304, '4 d''Épée'),
  (305, '5 d''Épée'), (306, '6 d''Épée'), (307, '7 d''Épée'), (308, '8 d''Épée'),
  (309, '9 d''Épée'), (310, '10 d''Épée'), (311, 'Valet d''Épée'), (312, 'Cavalier d''Épée'),
  (313, 'Dame d''Épée'), (314, 'Roi d''Épée'),
  (401, 'As de Denier'), (402, '2 de Denier'), (403, '3 de Denier'), (404, '4 de Denier'),
  (405, '5 de Denier'), (406, '6 de Denier'), (407, '7 de Denier'), (408, '8 de Denier'),
  (409, '9 de Denier'), (410, '10 de Denier'), (411, 'Valet de Denier'), (412, 'Cavalier de Denier'),
  (413, 'Dame de Denier'), (414, 'Roi de Denier')
) as v(numero, nom)
where napo_oracle_decks_catalogue.nom = 'Tarot de Marseille';

-- Tuile marketplace : même pattern que les decks Oracle existants
-- (catalogue_deck_id renseigné, catégorie Napo-Oracle, position 0).
insert into marketplace_modules (title, description, category, icon, status, cta, position, path, catalogue_deck_id)
select
  'Tarot de Marseille',
  'Tirages de tarot — 78 arcanes traditionnels, interprétation libre',
  'Napo-Oracle',
  'ti-cards',
  'available',
  'Bientôt disponible',
  0,
  null,
  id
from napo_oracle_decks_catalogue
where nom = 'Tarot de Marseille';
