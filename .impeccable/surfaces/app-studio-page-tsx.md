---
version: 1
slug: "app-studio-page-tsx"
primary_target: "app/studio/page.tsx"
related_targets: ["app/studio/media/[id]/page.tsx","components/studio/MediaEditor.tsx","components/MediaPlayer.tsx","app/watch/[id]/page.tsx","app/globals.css"]
---

## Scope and mode

- Surface: administration éditoriale `app/studio/page.tsx` et son éditeur média.
- Mode: Operate, tâche fréquente réservée aux administrateurs sur desktop et mobile.

## Audience, job and content

- Un administrateur ajoute un Flashy ou une vidéo, choisit une source simple ou HLS multi-qualités, complète les métadonnées puis contrôle sa publication.
- Les listes, validations, erreurs et statuts proviennent exclusivement de l'API Nino.

## Approved direction

- Décision explicite la plus récente : restaurer l’interface Nino V7 avant tout step-up visuel.
- Le dashboard reprend la navigation horizontale, les indicateurs et les panneaux sobres de V7.
- L’upload reprend le parcours V7 en étapes : fichier source, métadonnées, publication, visuels et aperçu rapide.
- Le choix fichier/HLS reste explicite et utilise exclusivement le contrat multipart V8.
- La création reste intégrée dans l’espace de travail et l’édition détaillée conserve sa route dédiée.
- Le stockage historique LUMA s'indexe depuis l'espace Système sans déplacer ni réencoder les segments ; les qualités détectées restent visibles dans la fiche média.
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
| Lignes média denses | Vignette 16:9, titre, source, visibilité, date et lien d'édition |
| Activité récente du mock | Omise : aucun endpoint d'audit ou d'activité disponible |
| Visuels | URLs catalogue existantes ou fallback géométrique, aucun raster généré dans l'UI |

## Delivered states and constraints

- Navigation clavier par flèches dans les navigations Studio et le choix de source ; focus orange visible.
- États couverts : chargement, file vide, erreur avec nouvelle tentative, accès administrateur refusé, enregistrement en cours, erreur et succès du formulaire.
- Desktop : trois files simultanées et navigation dédiée ; largeur intermédiaire : navigation réduite et files consultables horizontalement ; mobile : onglets Studio, une file à la fois et action primaire pleine largeur.
- Les brouillons restent absents du catalogue public ; Studio n'invente ni activité récente, ni état d'ingestion live.
- Le transcodage automatique et la progression d'upload ne font pas partie de cette livraison.

## Finish review

- Verdict final : **ship**.
- Référence de validation : `.impeccable/screenshots/studio-redesign-desktop-verdict.png` et `.impeccable/screenshots/studio-redesign-mobile-verdict.png`.
- Aucun finding ouvert après la revue finale.
