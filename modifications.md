# Modifications — 2026-08-07

## Profil praticien

- **Page "Gérer l'abonnement" dédiée** (`/profil/abonnement`, remplace l'ancien modal)
  - Nouvelle route dans `App.jsx` (pattern if/else manuel, pas de `<Routes>` — cohérent avec `/mon-agenda`)
  - `ProfilPage.jsx` : le bouton "Gérer l'abonnement" navigue vers la route au lieu d'ouvrir un modal
  - `ProfilAbonnement.jsx` : compte/sécurité, identité pro, coordonnées RDV, palier d'abonnement, addons (branchés sur les vraies données `marketplace_modules` + activation réelle), séances tarifées (somme `prix_euros`, étiqueté comme non confirmé côté paiement), agenda public, actions (modifier profil, changer mot de passe, déconnexion)
  - Bouton "← Retour au profil" (`navigate(-1)`)
  - Redirection vérifiée pour un utilisateur non connecté qui tape l'URL directement (tombe sur la Landing, pas de 404)

- **Historique + Bientôt** (`src/components/HistoriqueEtBientot.jsx`, intégré dans `ProfilPage.jsx`)
  - `HistoriqueAccordion` : accordéon 3 onglets (Séances / Paiements / Achats)
    - Séances : vraies données (`seances.prix_euros`, filtré `user_id`, exclut `statut='annulé'`)
    - Paiements / Achats : état vide honnête ("non disponible") — aucune table de paiement n'existe en base, pas de donnée inventée
  - `SectionBientot` : liste statique de 5 idées grisées, non cliquables (Parrainage, Abonnés à ma page, Affiliations, Napo-Annuaire, Napo-Événement)

- **Refactor** : logique d'activation des addons (`checkActivatedModules`, `activateCatalogueModule`, `deactivateCatalogueModule`) extraite dans `src/lib/marketplaceAddons.js`, partagée entre `NapoMarketplace.jsx` et `ProfilAbonnement.jsx`

## Nouveaux modules métier (pattern répliqué depuis NapoÉnergie)

Un module = 1-2 tables Supabase (RLS `auth.uid() = user_id`) + route + entrée sidebar + tuile `marketplace_modules` (catégorie `Napo-Métiers`) + page liste + page fiche séance.

### Module 1 — Napo-Magnétiseur (`/magnetisme`)
- Tables : `fiches_magnetisme` (séance), `fiches_magnetisme_zones` (7 zones/chakras, mesure avant/après par zone sur échelle 0-8 — nouveau vs. NapoÉnergie)
- `Magnetisme.jsx` (liste) + `MagnetismeSeance.jsx` (fiche)

### Module 2 — Napo-Médium (`/mediumnite`)
- Tables : `fiches_mediumnite` (séance), `fiches_mediumnite_perceptions` (liste répétable : type de perception, contenu reçu, validation client)
- `Mediumnite.jsx` (liste) + `MediumniteSeance.jsx` (fiche, perceptions ajoutables/supprimables)
- Description marketplace volontairement descriptive, sans promesse de résultat (point de vigilance légal)

### Module 3 — Napo-Radiesthésie (`/radiesthesie`)
- Tables : `fiches_radiesthesie` (séance), `fiches_radiesthesie_questions` (liste répétable : objet de recherche, question, réponse oui/non/intensité 0-8)
- `Radiesthesie.jsx` (liste) + `RadiesthesieSeance.jsx` (fiche)
- Hors scope respecté : aucun support cartographique (géobiologie) ajouté

## État

- `npm run build` : passe pour chaque étape
- Testé manuellement en local (persistance confirmée) pour la page Abonnement, l'accordéon Historique, et les 3 modules métier
- Rien poussé en prod — en attente de confirmation explicite avant déploiement
- Rien commité pour les 3 modules métier à ce stade (voir `git status`)
- ⚠️ Un vrai personal access token Supabase (`sbp_v0_...`) trouvé dans `.env.local` pendant un test de session — à révoquer/régénérer si pas encore fait
