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

### NapoÉnergie détail
- 7 chakras : rotation, état, taux Bovis, couleur perçue, avant/arrière, gauche/droite, observation
- Onglet Énergie dans fiche client : historique + Nouvelle séance + Supprimer
- Suppression cascade : energie_chakras_mesures avant energie_seances
- Navigation historique par chips numéro + date
- Sauvegarde manuelle uniquement

---

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
