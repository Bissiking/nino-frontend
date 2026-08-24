---
version: 1
slug: "app-studio-page-tsx"
primary_target: "app/studio/page.tsx"
related_targets: ["app/studio/media/[id]/page.tsx","app/studio/transcode/page.tsx","components/studio/MediaEditor.tsx","components/studio/StudioLibrary.tsx","components/studio/StudioNotifications.tsx","components/studio/StudioShell.tsx","components/MediaPlayer.tsx","app/watch/[id]/page.tsx","app/globals.css"]
---

## Scope and mode

- Surface: administration éditoriale `app/studio/page.tsx` et son éditeur média.
- Mode: Operate, tâche fréquente réservée aux administrateurs sur desktop et mobile.

## Audience, job and content

- Un administrateur ajoute un Flashy ou une vidéo, choisit une source simple ou HLS multi-qualités, complète les métadonnées puis contrôle sa publication.
- Les listes, validations, erreurs et statuts proviennent exclusivement de l'API Nino.

## Approved direction

- Décision explicite du 24 août 2026 : Nino Studio devient un véritable outil de création autonome, inspiré des maquettes fournies, sans modifier Nino standard.
- Le shell Studio utilise un header fixe compact, une recherche globale, une action principale, l’identité utilisateur et une sidebar dédiée.
- Le dashboard conserve les données réelles du catalogue et les files éditoriales, dans une composition plus aérée et responsive.
- Les bibliothèques Vidéos et Flashy proposent recherche, filtres, tri, vue liste/grille, pagination, inspection et actions réelles.
- Les notifications du header exposent leur chargement, leurs erreurs, leur état lu/non lu et les actions unitaires ou globales.
- L’éditeur utilise une colonne d’aperçu sticky et un panneau principal à onglets : contenu, publication, visuels, série et contenu sensible.
- L’upload conserve le parcours fichier source, métadonnées, publication, visuels et aperçu rapide.
- Le choix fichier/HLS reste explicite et utilise exclusivement le contrat multipart V8.
- La création reste intégrée dans l’espace de travail et l’édition détaillée conserve sa route dédiée.
- Le stockage historique LUMA s'indexe depuis l'espace Système sans déplacer ni réencoder les segments ; les qualités détectées restent visibles dans la fiche média.
- La page Transcodage charge et enregistre la configuration réelle du worker, avec restauration de la configuration par défaut.
- Le dégradé corail-orange V7 porte l’action principale ; le focus blanc reste visible au clavier et à la télécommande.

## Memorable moment

- L'administrateur voit immédiatement où se trouve chaque programme dans le cycle de publication et peut passer d'une file à l'autre sans perdre son contexte.

## Composition inventory

| Élément | Traduction de production |
|---|---|
| Navigation Studio verticale | HTML sémantique + icônes Lucide, repli en barre horizontale mobile |
| Barre de commande | Recherche, filtre de visibilité et actions réelles en React/CSS |
| Ligne de charge | Totaux Médias, À préparer, Programmés et Publiés dérivés du catalogue administrateur |
| Files À préparer / Programmé / Publié | Trois listes dérivées des objets `MediaItem`, aucune donnée illustrative |
| Bibliothèques Vidéos / Flashy | Recherche, filtres, tri, deux dispositions, pagination, inspecteur et suppression confirmée |
| Notifications | Panneau accessible, compteur non lu, marquage unitaire et global persisté par l'API |
| Séries / Planning / Direct / Système | Espaces de travail alimentés par les contrats backend disponibles, sans commandes simulées |
| Transcodage | Santé du worker, file, actions de reprise et formulaire de configuration persisté |
| Lignes média denses | Vignette 16:9, titre, source, visibilité, date et lien d'édition |
| Activité récente du mock | Omise : aucun endpoint d'audit ou d'activité disponible |
| Visuels | URLs catalogue existantes ou fallback géométrique, aucun raster généré dans l'UI |

## Delivered states and constraints

- Navigation clavier par flèches dans les navigations Studio et le choix de source ; focus orange visible.
- États couverts : chargement, file vide, erreur avec nouvelle tentative, accès administrateur refusé, perte de connexion, enregistrement en cours, confirmation destructive, erreur et succès du formulaire.
- Desktop : sidebar complète et trois files simultanées ; tablette : sidebar compacte puis drawer ; mobile : drawer, métriques en grille 2x2, une file à la fois et actions recomposées.
- Les brouillons restent absents du catalogue public ; Studio n'invente ni activité récente, ni état d'ingestion live.
- Les contrôles d'ingestion du direct et l'historique d'activité restent absents tant que le backend ne fournit pas ces contrats ; aucune commande décorative n'est affichée.

## Finish review

- Verdict final : **ship**.
- Référence de validation : `.impeccable/screenshots/studio-full-dashboard-verdict.png`, `.impeccable/screenshots/studio-final-notifications.png`, `.impeccable/screenshots/studio-final-editor-clean.png` et `.impeccable/screenshots/studio-final-mobile.png`.
- Aucun finding ouvert après la revue finale.
