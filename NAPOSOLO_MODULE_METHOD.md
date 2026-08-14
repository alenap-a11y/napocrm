# Naposolo — Méthode de création de module

> Référence permanente. Mettre à jour à chaque nouveau module livré.
> Projet ID Supabase : `jzwwqngbgcdeyiqrvtle`
> Stack : React/Vite + Supabase + Vercel | Deploy : `git push` → auto

---

## Stack & fichiers clés

| Fichier | Rôle |
|---|---|
| `src/AppShell.jsx` | Routes lazy + sidebar items ALL_SB_ITEMS |
| `src/pages/Clients.jsx` | Référence UI à reproduire à l'identique |
| `src/components/SideBar.jsx` | Navigation principale |
| `src/lib/supabase.js` | Client Supabase |
| `src/pages/Energie.jsx` | Exemple liste module |
| `src/pages/EnergieSéance.jsx` | Exemple détail module |

### Variables CSS obligatoires
- var(--color-accent)
- var(--color-text-primary)
- var(--color-text-secondary)
- var(--color-background-primary)
- var(--color-background-secondary)
- var(--color-border-tertiary)
- var(--color-border-secondary)

---

## Méthode standard — 5 étapes (toujours dans cet ordre)

### Étape 1 — SQL Supabase
Avant tout code React. Toujours.
- Créer tables avec user_id + client_id
- RLS + policy auth.uid() = user_id sur toutes les tables
- Vérif : Table visible Supabase Table Editor

### Étape 2 — Route + Sidebar AppShell.jsx
- Lazy import ligne ~31
- ALL_SB_ITEMS ligne ~59
- Routes ligne ~471
- ATTENTION : créer les fichiers JSX AVANT npm run build

### Étape 3 — Page liste (layout Clients.jsx)
- Header : icon + titre + sous-titre + bouton Nouveau
- 4 StatCards : repeat(4,1fr) gap 12
- Tabs : border-bottom accent marginBottom -1
- Recherche : input + icône ti-search absolue
- Table : background-secondary borderRadius 12 grid colonnes
- Compteur bas : flex-end fontSize 13

### Étape 4 — Page détail (/module/:id)
- Bouton retour + fil ariane + titre + Sauvegarder droite
- En-tête : date heure infos dans background-secondary borderRadius 14
- Historique : chips cliquables
- Toast sauvegardé 2.5s
- Pattern save : setSaving + supabase update + setSaved + setTimeout

### Étape 5 — Onglet fiche client Clients.jsx
- Ajouter dans tableau tabs modal
- Ajouter state + useEffect chargement par client_id
- Bloc JSX conditionnel avant section Actions
- Bouton Nouvelle : insert DB + window.location.href
- Bouton Supprimer : confirm() + delete cascade enfant d'abord + filter state
- Bouton Voir : window.location.href vers page détail

### Deploy final
- supabase db push SI SQL modifié
- npm run build + git add + commit + push
- Vérif cache : curl https://naposolo.com | grep "index-"

---

## Modules livrés

| Module | Route | Tables SQL | Statut |
|---|---|---|---|
| Alpha toggle | /napo-cockpit-7X | app_config | OK juin 2026 |
| NapoÉnergie | /energie | energie_seances, energie_chakras_mesures | OK juin 2026 |
| Napo-3D | /napo-3d | seances (réutilisée, filtre type_seance='3D Humain') | OK juillet 2026 |
| Présentation praticien | /presentation | profiles (colonnes réutilisées + ajoutées), offres_praticien | OK août 2026 |

### NapoÉnergie détail
- 7 chakras : rotation, état, taux Bovis, couleur perçue, avant/arrière, gauche/droite, observation
- Onglet Énergie dans fiche client : historique + Nouvelle séance + Supprimer
- Suppression cascade : energie_chakras_mesures avant energie_seances
- Navigation historique par chips numéro + date
- Sauvegarde manuelle uniquement

### Napo-3D détail
- Architecture divergente du pattern standard, assumée : pas de nouvelle table SQL. Réutilise la table `seances` existante, filtrée sur `type_seance = '3D Humain'`. Décision prise après analyse coût/bénéfice — éviter de dupliquer resolveClientId, autocomplete client, envoi email confirmation déjà présents dans NouvelleSeance.jsx.
- Pages : `Napo3D.jsx` (liste, layout Clients.jsx : StatCards + tabs + recherche), `Napo3DSeance.jsx` (fiche détail, layout EnergieSéance.jsx : historique chips + sauvegarde manuelle)
- Création : réutilise `NouvelleSeance.jsx` existant (canvas Three.js/GLTF), pas de composant dédié. Route dupliquée `/napo-3d/nouvelle` -> même composant que `/seances/nouvelle`, uniquement pour que le préfixe d'URL matche l'item sidebar actif (NavLink matche par préfixe, pas par exact).
- `NouvelleSeance.jsx` lit `?type=` en query param (`searchParams.get('type')`) pour pré-sélectionner le type et déterminer le routage retour (`isFrom3D`). Toute autre page qui redirige vers ce formulaire doit passer ce paramètre explicitement, sinon le type retombe sur 'Sophrologie' par défaut.
- Fiche détail (`Napo3DSeance.jsx`) affiche les zones annotées (`schema_annotations`) en liste texte (pastille couleur + nom de zone), PAS de replay du corps 3D — `captureSchema()` génère un PNG côté client mais ne le sauvegarde jamais en base/Storage. Si un aperçu visuel devient nécessaire : soit uploader ce PNG vers Supabase Storage au moment du save, soit rejoindre la scène Three.js en lecture seule dans la fiche (chantier plus lourd, non fait).

---

### Présentation praticien détail

- Architecture divergente assumée, comme Napo-3D : reconnaissance préalable (grep) a montré qu'un cadrage écrit à froid supposait un `Annuaire.jsx` et un modèle `presentation_*` neufs qui n'existaient pas. Le vrai système est `src/pages/client/screens/ClientAnnuaire.jsx` + `PraticienCard.jsx`, alimenté par la fonction SQL `search_praticiens()` qui lit directement des colonnes de `profiles`. Décision : réutiliser ces colonnes (pays, langues, types_prestation, musiques, livres, recettes, specialites, bio, avatar_url, siret, metier) plutôt que dupliquer un second modèle parallèle.
- Colonnes ajoutées sur `profiles` (jamais de préfixe `presentation_` sur les champs de contenu, seulement sur le statut) : `anciennete_depuis`, `charte_acceptee_le`, `aides_services`, `desactivation_motif`, `desactivation_le`, puis `parcours`, `formations`, `tarif_indicatif`, `tel_pro`, `email_pro`, `films_series`, `passions`, `animal`, `petit_plaisir`, `endroit_prefere`, `cote_decale`, `phrase_representative`, `choses_insolites`.
- Table `offres_praticien` (type/modalité/date_prevue, RLS calquée sur le pattern `agenda_public_anon_select`), jointe en lateral dans `search_praticiens()` pour exposer une "prochaine offre" sur la carte Annuaire.
- **Statut de publication : `profiles.presentation_statut` (brouillon/publie), distinct de `agenda_public`.** Décision prise en cours de chantier après qu'une modification hors pipeline versionné (colonne + fonction modifiées directement en base, sans migration locale, pendant qu'une session travaillait sur ce fichier) a fait basculer `search_praticiens()` sur ce critère. Plutôt que de revenir en arrière, la divergence a été actée : `agenda_public` reste dédié à la réservation en ligne (ProfilPage.jsx), `presentation_statut` gouverne la visibilité de la fiche vitrine dans l'Annuaire. **Point de vigilance non résolu** : `ProfilPage.jsx` affiche encore "⚫ Désactivé — invisible du public" pour `agenda_public`, ce qui est devenu trompeur — désactiver l'agenda ne masque plus la fiche Présentation. À corriger un jour si ça crée de la confusion côté praticien.
- **Incident évité, à retenir** : une modification directe en base (hors `supabase db push`/migration) a introduit `presentation_statut` ET ajouté `p.siret` au retour public de `search_praticiens()`, en contradiction avec le commentaire de sécurité d'origine de cette fonction (siret jamais exposé publiquement). Détecté avant commit en interrogeant `pg_get_functiondef` sur la fonction live avant de committer — retiré via migration `20260814170000`. Réflexe à garder : avant tout commit touchant à une fonction/table déjà en prod, vérifier l'état réel en base (`pg_get_functiondef`, `information_schema.columns`) plutôt que de supposer que le fichier local ou le dernier message de session reflète la vérité — une édition directe en base ou dans un fichier peut être arrivée entre-temps, par un autre canal.

## Décision architecture — modules 3D (juillet 2026)

Historique de la décision, dans l'ordre :

1. **Départ (Napo-3D v1)** : filtre sur la table `seances` existante (`type_seance = '3D Humain'`), pas de table dédiée. Choix initial pour éviter de dupliquer resolveClientId/autocomplete/email déjà présents dans NouvelleSeance.jsx.

2. **Revirement assumé** : dès qu'un deuxième module 3D est prévu (3D Animaux, table `seances3dA`), le filtre sur une table générique unique ne tient plus — deux types de corps (humain/animal) ont des GLTF et des ancres anatomiques différents, donc des besoins de structure différents. Décision : chaque variante 3D a sa propre table.

3. **Renommage prévu** : `NouvelleSeance.jsx` → `NouvelleSeance3DH.jsx` (H = Humain). **STATUT : PAS ENCORE FAIT.** Bloqué en attente du `grep -rn "NouvelleSeance" src/AppShell.jsx` pour lister toutes les références (lazy import, routes `/seances/nouvelle`, `/napo-3d/nouvelle`) à mettre à jour en même temps que le renommage, pour ne rien casser.

4. **Nouvelle table `seances3dH`** (remplace le filtre sur `seances`) : `user_id, client_id, prenom, nom, genre, tel, email, date_naissance, date_seance, heure_seance, duree_minutes, prix_euros, schema_annotations (jsonb), zones_corps (jsonb), tags (jsonb), notes, numero_seance, statut, premiere_seance, date_creation`. Pas de colonne `type_seance` — la table entière EST le type. **STATUT : SQL PAS ENCORE ÉCRIT**, en attente de confirmation post-renommage.

5. **Migration des données existantes** : décidée non-critique ("pas grave, go") — les séances 3D de test déjà dans `seances` restent où elles sont, pas de migration rétroactive vers `seances3dH`.

6. **Refactorisation prévue avant duplication** : extraire la logique Three.js générique de NouvelleSeance3DH.jsx (BodyMesh, ancres anatomiques, contrôles caméra, calibration) en composant réutilisable, paramétré par `modelPath` + `anchors`. Objectif : que le futur module 3D Animaux réutilise ce composant au lieu de dupliquer ~500 lignes de logique Three.js identique. **STATUT : PAS COMMENCÉ**, à faire avant d'attaquer 3DA, pas après.

7. **Futur module 3D Animaux (3DA)** : table `seances3dA`, même schéma que 3dH adapté, nouveau GLTF, nouvelles ancres. Dépend de l'étape 6 pour éviter la duplication.

### Règle de migration générale (tous futurs modules type SeanceStandard)

Si un type de séance démarre comme `type_seance = 'X'` filtré sur `seances` (ex: futur module Méditation), et migre plus tard vers sa propre table dédiée (façon Énergie) :
- Migration = `INSERT INTO seances_x (...) SELECT ... FROM seances WHERE type_seance = 'X'`
- **Ne jamais supprimer les lignes originales de `seances` après migration** — si un email de confirmation ou un lien externe référence l'`id` d'origine, le lien casse. Garder le doublon temporaire, faire pointer le code vers la nouvelle table à partir de la date de bascule.
- Donc : aucun module démarré sur `seances` filtrée n'est jamais "coincé" — l'évolution vers une table dédiée reste toujours possible sans refonte lourde.

## Routage Agenda -> modules dédiés (juillet 2026)

Contexte : le bouton "Séance du jour" dans Agenda.jsx pointait toujours vers FicheSeance.jsx
(fiche générique), même pour des RDV de type Énergie/3D — perte totale des données
spécifiques au module (chakras, annotations 3D). Corrigé en option (A) : NouveauRdv.jsx
crée toujours une ligne dans `seances` (pour le calendrier), PLUS une ligne liée dans la
table du module concerné si le type correspond. Une seule source de vérité pour le
calendrier (`seances`), zéro refonte d'Agenda.jsx (drag/resize/conflits inchangés).

### Corrélation type -> module (validée juillet 2026)

Le module Énergie se déclenche pour TROIS valeurs de `type_seance`, pas une seule :
Ces trois valeurs viennent de deux listes différentes mélangées dans le select
NouveauRdv.jsx (mélange assumé, pas un bug — voir section "Listes dupliquées" ci-dessous) :
'Énergie' = liste type_seance (8 valeurs), 'Magnétiseur'/'Énergéticien' = liste des 18
métiers. Si un nouveau métier énergétique est ajouté un jour (ex: Radiesthésiste), il faut
l'ajouter manuellement dans CETTE liste précise, à 3 endroits (voir ci-dessous) — pas de
détection automatique par mot-clé.

### Fichiers modifiés et logique exacte

**NouveauRdv.jsx** (création d'un RDV) :
- Après l'insert dans `seances`, si `['Énergie','Magnétiseur','Énergéticien'].includes(typeSeance)`
  et qu'un client est lié : insert supplémentaire dans `energie_seances`
  (user_id, client_id, date_seance, heure_seance, numero_seance calculé par comptage).
- Erreur silencieuse en `console.warn` si ça échoue (RDV quand même créé dans `seances`,
  pas de blocage utilisateur).

**Agenda.jsx — saveEdit()** (modification d'un RDV existant) :
- Même logique que NouveauRdv.jsx, déclenchée à la sauvegarde d'une édition.
- Anti-doublon : recherche une ligne existante par `client_id + date_seance + heure_seance`
  exacts avant d'insérer — évite de dupliquer si on sauvegarde plusieurs fois sans changer le type.
- LIMITE CONNUE, pas corrigée : si on modifie la date/heure d'un RDV Énergie déjà lié EN
  MÊME TEMPS que la sauvegarde, l'anti-doublon cherche avec la NOUVELLE date/heure, ne
  trouve rien, et crée une deuxième ligne au lieu de mettre à jour l'ancienne. À corriger
  si ce cas se présente en usage réel (chercher par l'ancienne date/heure avant modif).

**Agenda.jsx — bouton "Séance du jour"** :
- Routage conditionnel selon `detail.type_seance` :
  - Énergie/Magnétiseur/Énergéticien -> recherche l'id correspondant dans `energie_seances`
    par `client_id + date_seance`, redirige vers `/energie/:id`. Si non trouvé (RDV créé
    avant ce patch, ou insert lié qui a échoué) -> fallback vers `/seances/:id/fiche`.
  - 3D Humain -> `/napo-3d/seance/:id` directement (pas de recherche, id identique car
    Napo-3D filtre encore sur la table `seances`, voir section 3D ci-dessous).
  - Tout le reste -> `/seances/:id/fiche` (comportement d'origine inchangé).

### Non fait dans ce chantier

- **Fleurs de Bach** : pas de routage équivalent. Bloqué volontairement — le schéma
  `fiches_bach` (selection, client_info en JSON) est piloté par un wizard 6 étapes non vu
  en détail ; insérer une ligne "vide" à la création du RDV risquerait une fiche Bach
  incohérente avec ce que le wizard attend en la rouvrant. À faire quand le composant
  wizard Bach aura été audité.
- **Édition avec changement simultané date/heure + type** sur un RDV déjà lié — limite
  connue ci-dessus, non corrigée.

## Modules backlog

| Module | Priorité | Notes |
|---|---|---|
| Fiche client page dédiée | ROUGE | Refactoring modal vers /clients/:id |
| NapoOracle standalone | JAUNE | Déjà dans app à isoler |
| NapoAnnuaire | VERT | Annuaire praticiens |
| NapoCartes | VERT | Cartes mantras |
| NapoEvents | VERT | Événements ateliers |
| V2 co-consultation | VERT | Ne pas builder maintenant |

---

## Règles sécurité

- RLS toutes les tables sans exception
- auth.uid() = user_id sur chaque policy
- Jamais service_role côté client
- Suppression cascade : table enfant d'abord puis parent
- Tester cross-compte : 2 users isolation données
- Jamais de service_role hardcodé dans du code client, surtout pages publiques (ex: AgendaPublic.jsx découvert juillet 2026) — utiliser supabase.functions.invoke() qui passe la clé anon déjà configurée ; le service_role reste uniquement côté Edge Function serveur

---

## Règles code

### 3 couches formulaire
1. Display = JSX input visible
2. State = useState + onChange
3. Database = champ Supabase insert/update

### Import Supabase
- Correct : import { supabase } from '../lib/supabase'
- Interdit : import { supabase } from '../supabaseClient'

### Fichiers JSX avec accents ou emojis
Toujours passer par Python :
python3 avec content = string et open(filepath, 'w')
Jamais heredoc bash pour du JSX (chevrons et backticks cassent tout)

### Pièges connus
- window.location.reload() sans counter = boucle infinie ChunkErrorBoundary
- Vercel CDN cache stale 15min : tester curl | grep index-
- Apostrophes dans JSX strings : utiliser unicode \u2019
- Heredoc bash échoue avec JSX : toujours Python
- Nom fichier avec accents : vérifier avec ls | grep -i nom après création
- routerNavigate via useNavigate() dans AppShell ligne ~107
