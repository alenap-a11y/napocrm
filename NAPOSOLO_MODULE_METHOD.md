# Naposolo — Méthode de création de module

> Référence permanente. Mettre à jour à chaque nouveau module livré.
> Projet ID Supabase : `jzwwqngbgcdeyiqrvtle`
> Stack : React/Vite + Supabase + Vercel | Deploy : `git push` → auto

---

## Stack & fichiers clés

| Fichier | Rôle |
|---|---|
| `src/AppShell.jsx` | Routes lazy + sidebar items `ALL_SB_ITEMS` |
| `src/pages/Clients.jsx` | Référence UI à reproduire à l'identique |
| `src/components/SideBar.jsx` | Navigation principale |
| `src/lib/supabase.js` | Client Supabase |

### Variables CSS obligatoires
```
var(--color-accent)
var(--color-text-primary)
var(--color-text-secondary)
var(--color-background-primary)
var(--color-background-secondary)
var(--color-border-tertiary)
var(--color-border-secondary)
```

---

## Méthode standard — 5 étapes (toujours dans cet ordre)

### 🔴 Étape 1 — SQL Supabase
**Avant tout code React.**
```sql
-- 1. Créer les tables
CREATE TABLE IF NOT EXISTS module_xxx (...);

-- 2. RLS obligatoire sur toutes les tables
ALTER TABLE module_xxx ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user isole" ON module_xxx
  USING (auth.uid() = user_id);

-- 3. Valeurs initiales si besoin
INSERT INTO app_config (key, value) VALUES ('xxx_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
```
✅ Vérification : Table visible dans Supabase Table Editor
✅ Vérification : `SELECT * FROM module_xxx` retourne vide (pas d'erreur)

---

### 🔴 Étape 2 — Route + Sidebar dans AppShell.jsx
```js
// Lazy import (ligne ~15)
const MonModule = lazy(() => import('./pages/MonModule'))

// ALL_SB_ITEMS (ligne ~55)
{ id: 'monmodule', label: 'Mon Module', icon: 'ti-xxx', to: '/monmodule' }

// Route dans <Routes> (chercher pattern existant)
<Route path="/monmodule" element={<MonModule />} />
<Route path="/monmodule/:id" element={<MonModuleDetail />} />
```
✅ Vérification : icône visible dans sidebar
✅ Vérification : route `/monmodule` accessible sans erreur 404

---

### 🔴 Étape 3 — Page liste (même layout que Clients.jsx)

**Structure obligatoire à respecter :**
```jsx
// 1. Header
<div> icon + titre + sous-titre + boutons droite (Nouveau) </div>

// 2. 4 StatCards identiques
<div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
  <StatCard icon="..." iconBg="..." iconColor="..." label="..." value={...} />
</div>

// 3. Tabs (même style border-bottom accent)
<div style={{ display:'flex', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
  {TABS.map(tab => <button .../>)}
</div>

// 4. Table liste avec grid colonnes
<div style={{ background:'var(--color-background-secondary)', borderRadius:12 }}>
  // Header colonnes
  // Lignes cliquables → openDetail()
</div>

// 5. Compteur bas de page
<div>{filtered.length} élément(s) affiché(s)</div>
```
✅ Vérification : page s'affiche sans erreur console
✅ Vérification : données chargées depuis Supabase

---

### 🔴 Étape 4 — Page / Modal détail

**Structure obligatoire :**
```jsx
// Modal fixe (position:fixed, inset:0, zIndex:1000)
// ou page dédiée /module/:id

// Header : avatar/icône + nom + badges statut
// Tabs : Infos | Historique | Notes | (spécifique module)
// Actions bas : Supprimer | Modifier | Fermer
```
✅ Vérification : ouverture/fermeture sans bug
✅ Vérification : CRUD complet (create, read, update, delete)

---

### 🔴 Étape 5 — Intégration fiche client (si lié aux clients)

Dans `src/pages/Clients.jsx` — modal détail client :
```jsx
// Ajouter onglet dans le tableau des tabs (ligne ~détailTab)
['energie', 'Énergie', 'ti-sparkles'],

// Ajouter bloc conditionnel après onglet bach
{detailTab === 'energie' && !editingDetail && (
  <div>
    // Liste des séances du module pour ce client
    // Bouton "Nouvelle séance" → navigate(`/energie/nouvelle?client=${detail.id}`)
    // Historique compact (date, statut, lien "Voir")
  </div>
)}
```
✅ Vérification : onglet visible dans fiche client
✅ Vérification : lien vers page module fonctionnel

---

### 🔴 Deploy final
```bash
# Si SQL modifié :
supabase db push

# Toujours :
cd ~/napocrm && npm run build && git add . && git commit -m "feat: module [NOM]" && git push
```
✅ Vérification cache Vercel : `curl https://naposolo.com | grep "index-"`

---

## Modules livrés

| Module | Route | Tables SQL | Statut |
|---|---|---|---|
| Alpha toggle | `/napo-cockpit-7X` | `app_config` | ✅ Livré juin 2026 |
| **NapoÉnergie** | `/energie` | `energie_seances`, `energie_chakras_mesures` | 🔄 En cours |

---

## Modules en backlog

| Module | Priorité | Notes |
|---|---|---|
| NapoÉnergie | 🔴 | Fiche 7 chakras, séances énergie, lié clients |
| NapoOracle standalone | 🟡 | Déjà dans app, à isoler |
| NapoAnnuaire | 🟢 | Annuaire praticiens |
| NapoCartes | 🟢 | Cartes mantras physiques/digitales |
| NapoEvents | 🟢 | Événements / ateliers |
| V2 co-consultation | 🟢 | Multi-experts / 1 client — ne pas builder maintenant |

---

## Règles de sécurité obligatoires

- **RLS sur toutes les tables** — aucune exception
- **`auth.uid() = user_id`** sur chaque policy
- **Jamais de `service_role` côté client**
- Tester cross-compte : se connecter avec 2 users différents et vérifier isolation données

---

## Règles de code React/Supabase

### 3 couches formulaire (rappel systématique)
1. **Display** = JSX input visible
2. **State** = `useState` + `onChange`
3. **Database** = champ dans objet Supabase `insert/update`

### Import Supabase
```js
import { supabase } from '../lib/supabase'  // ✅
// PAS '../supabaseClient'                   // ❌
```

### Deploy
```bash
cd ~/napocrm && git add . && git commit -m "feat/fix: [desc]" && git push
# SQL en premier si migration : supabase db push AVANT git push
```

### Pièges connus
- `window.location.reload()` sans counter = boucle infinie (ChunkErrorBoundary)
- Vercel CDN cache stale jusqu'à 15min → tester avec `curl | grep index-`
- Apostrophes dans JSX strings → utiliser `\u2019` ou template literals
- `routerNavigate` doit être déclaré via `useNavigate()` dans AppShell ~ligne 107
