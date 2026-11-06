---
version: 1
slug: "app-studio-page-tsx"
primary_target: "app/studio/page.tsx"
related_targets: ["app/studio/media/[id]/page.tsx","app/studio/transcode/page.tsx","components/studio/MediaEditor.tsx","components/studio/StudioLibrary.tsx","components/studio/StudioNotifications.tsx","components/studio/StudioShell.tsx","components/ProfileMenu.tsx","components/ui/Menu.tsx","components/ui/Dialog.tsx","lib/navigation.ts","components/MediaPlayer.tsx","app/watch/[id]/page.tsx","app/navigation.css","app/globals.css"]
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
- La demande explicite du 6 novembre 2026 autorise la refonte de tous les menus et leurs regroupements, y compris modales et JavaScript. Elle remplace la restriction V7 pour les menus uniquement, sans nouvelle imagerie ni remplacement du monde Nino ou du Top 10.
- La sidebar regroupe Piloter (Tableau, Programmation), Bibliothèque (Vidéos, Séries, Flashy) et Exploitation (Transcodage, Système, Direct · DEV). Le mobile et la tablette jusqu’à 860px retrouvent les huit destinations dans un tiroir modal natif.
- La recherche s’ouvre en dialogue natif par bouton ou Ctrl/⌘ K, propose des accès rapides et transmet la requête à la bibliothèque Vidéos. Créer regroupe Nouvelle vidéo, Nouveau Flashy et Nouvelle série ; le format court ouvre réellement l’éditeur avec `kind=short`.
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
| Navigation Studio verticale | Trois groupes, liens avec état actif, sidebar complète puis compacte entre 861 et 1180px ; tiroir modal natif jusqu’à 860px, retour vers Nino |
| Recherche du header | Dialogue natif, Ctrl/⌘ K, accès rapides et envoi de la requête au filtre de la bibliothèque Vidéos |
| Créer | Menu partagé réservé aux administrateurs : vidéo, Flashy et série, avec destinations réelles |
| Compte | Modale native partagée avec Nino : identité, navigation publique, profils, retour Nino pour l’administrateur et déconnexion |
| Barre de commande | Recherche, filtre de visibilité et actions réelles en React/CSS |
| Ligne de charge | Totaux Médias, À préparer, Programmés et Publiés dérivés du catalogue administrateur |
| Files À préparer / Programmé / Publié | Trois listes dérivées des objets `MediaItem`, aucune donnée illustrative |
| Bibliothèques Vidéos / Flashy | Recherche, filtres, tri, deux dispositions, pagination, inspecteur et suppression confirmée |
| Notifications | Panneau latéral modal natif, compteur non lu, chargement, vide, erreur avec nouvelle tentative, marquage unitaire et global persisté par l'API |
| Séries / Planning / Direct / Système | Espaces de travail alimentés par les contrats backend disponibles, sans commandes simulées |
| Transcodage | Santé du worker, file, actions de reprise et formulaire de configuration persisté |
| Lignes média denses | Vignette 16:9, titre, source, visibilité, date et lien d'édition |
| Activité récente du mock | Omise : aucun endpoint d'audit ou d'activité disponible |
| Visuels | URLs catalogue existantes ou fallback géométrique, aucun raster généré dans l'UI |

## Delivered states and constraints

- Navigation clavier et télécommande avec focus visible ; les menus partagés prennent en charge flèches haut/bas, Début/Fin, recherche par frappe, éléments désactivés et retour au déclencheur par Échap ou Retour. Les dialogues contiennent le focus et rendent l’arrière-plan inerte.
- États couverts : chargement, file vide, erreur avec nouvelle tentative, accès administrateur refusé, perte de connexion, enregistrement en cours, confirmation destructive, erreur et succès du formulaire.
- Desktop : sidebar complète et trois files simultanées ; tablette : sidebar compacte puis drawer ; mobile : drawer, métriques en grille 2x2, une file à la fois et actions recomposées.
- Les brouillons restent absents du catalogue public ; Studio n'invente ni activité récente, ni état d'ingestion live.
- Les contrôles d'ingestion du direct et l'historique d'activité restent absents tant que le backend ne fournit pas ces contrats ; aucune commande décorative n'est affichée.

## Finish review

- Verdict final : **ship**.
- Référence de validation : `.impeccable/screenshots/studio-full-dashboard-verdict.png`, `.impeccable/screenshots/studio-final-notifications.png`, `.impeccable/screenshots/studio-final-editor-clean.png` et `.impeccable/screenshots/studio-final-mobile.png`.
- Aucun finding ouvert après la revue finale.
- Navigation du 6 novembre 2026 : verdict **ship**, aucun finding matériel ouvert ; `../nino-backend/docs/evidence/navigation/results.json` recense 12 groupes réussis et 25 captures aux largeurs 375, 430, 768, 1440 et 1920px, dont 100 touches directionnelles simulées.
- Ces vérifications utilisent Chrome headless, le frontend réel et des réponses API interceptées. Elles couvrent notamment le tiroir, la recherche et son filtre réel, Créer et l’éditeur Flashy, le compte, les notifications, les refus d’accès et les reprises après erreur. Aucun SSO/fournisseur réel, backend réel ou téléviseur physique n’est prouvé ; aucun contrat API n’a changé.
