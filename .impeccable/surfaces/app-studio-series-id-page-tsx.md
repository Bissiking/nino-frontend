---
version: 1
slug: "app-studio-series-id-page-tsx"
primary_target: "app/studio/series/[id]/page.tsx"
related_targets: ["components/studio/StudioShell.tsx","components/studio/MediaEditor.tsx","app/studio/videos/new/page.tsx","app/globals.css"]
---

## Scope and mode

- Surface : édition complète d'une série et organisation de ses épisodes.
- Mode : Operate, usage administratif dense sur desktop avec adaptation mobile linéaire.

## Approved direction

- Décision explicite du 24 août 2026 : reproduire la structure de la référence fournie sans en reprendre les couleurs.
- Desktop : shell éditeur plein écran, sidebar permanente, actions de publication en haut et grille asymétrique 12 colonnes.
- Hiérarchie : informations et synopsis, puis médias et organisation saisons/épisodes, puis paramètres.
- Mobile : header compact, actions recomposées et sections affichées dans l'ordre 1 à 5.
- Toutes les commandes visibles reposent sur un contrat existant : sauvegarde, publication, visuels, ajout d'épisode, aperçu et réorganisation.

## Delivered states and constraints

- Chargement, erreur, confirmation de sauvegarde, publication en cours, upload d'image et listes de saisons vides sont couverts.
- La langue reste affichée en lecture seule car elle n'est pas exposée par l'API média.
- La galerie multi-image, les commentaires et le téléchargement ne sont pas affichés car aucun contrat backend ne les expose.
- Références : `.impeccable/screenshots/series-editor-layout-verdict.png` et `.impeccable/screenshots/series-editor-layout-mobile-verdict.png`.
