# Changelog — Nino Frontend

Toutes les modifications notables de ce dépôt sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

---

## [8.8.0] — 2026-08-24

### Nouveautés

- **Système de routing unifié** : Migration complète des hash routes (`/studio#videos`) vers des routes réelles (`/studio/videos`). La navigation sidebar utilise désormais exclusivement des routes Next.js.
- **Page Séries dédiée** (`/studio/series`) : Nouvelle vue avec tableau filtrable, métriques, recherche, tri et pagination.
- **Éditeur de séries** (`/studio/series/[id]`) : Interface de gestion complète avec sections numérotées (Informations générales, Synopsis, Médias, Organisation, Paramètres).
- **Création de série** (`/studio/series/new`) : Page dédiée à la création via `MediaEditor`.
- **Stockage système** : Nouvelle visualisation dans Administration avec barre de progression colorée par type de contenu (Vidéos, Flashy, Direct, Images).
- **Hook `useStudioData`** : Hook partagé pour le chargement des données Studio (media + stats + vérification admin).
- **Pages Studio séparées** : Chaque section a sa propre page (`/studio/overview`, `/studio/videos`, `/studio/flashy`, `/studio/schedule`, `/studio/live`, `/studio/administration`).

### Fichiers ajoutés

- `app/studio/overview/page.tsx` — Tableau éditorial
- `app/studio/videos/page.tsx` — Bibliothèque vidéo
- `app/studio/flashy/page.tsx` — Flashy
- `app/studio/schedule/page.tsx` — Programmation
- `app/studio/live/page.tsx` — Direct
- `app/studio/administration/page.tsx` — Système
- `app/studio/series/page.tsx` — Liste des séries
- `app/studio/series/[id]/page.tsx` — Éditeur de série
- `app/studio/series/new/page.tsx` — Création de série
- `hooks/useStudioData.ts` — Hook de données partagé

### Modifications

- **StudioShell** : Sidebar repensée avec navigation par routes réelles, suppression du widget "Espace de stockage".
- **`/studio`** : Redirige vers `/studio/overview`.
- **Admin redirect** : `/admin` redirige vers `/studio/administration`.
- **MediaEditor** : Les boutons Annuler/Supprimer redirigent vers `/studio/videos`.

### Supprimé

- Widget "Espace de stockage" de la sidebar.
- Section "Indexation du stockage" de la page Administration.
- Système de hash routes (`window.location.hash`, `hashchange` listeners).
- Composant `SeriesWorkspace` inline (remplacé par les pages dédiées).

### CSS

- +1900 lignes de styles pour les nouvelles pages (séries, stockage, éditeur).
- Design system cohérent : variables `--orange`, `--success`, `--warning`, `--muted`.
- Responsive desktop / tablette / mobile.

---

## [8.7.7] — 2026-08-23

- Correction de bugs mineurs.
- Mise à jour des dépendances.