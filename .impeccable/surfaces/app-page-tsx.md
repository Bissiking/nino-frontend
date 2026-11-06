---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/flashy/page.tsx","components/AppShell.tsx","components/ProfileMenu.tsx","components/HeroConsole.tsx","components/HomeTopTen.tsx","components/CategoryStrip.tsx","components/Rail.tsx","components/MediaCard.tsx","components/MediaPlayer.tsx","components/ui/Menu.tsx","components/ui/Dialog.tsx","lib/navigation.ts","app/navigation.css","app/globals.css"]
---

## Scope and mode

- Surface: accueil `app/page.tsx` et destination associée `app/flashy/page.tsx`.
- Mode: Operate, expérience de streaming TV-first adaptée au desktop et au mobile.

## Audience, job and content

- Un profil du foyer doit comprendre immédiatement le programme mis en avant, reprendre une lecture, explorer le classement, les catégories et les formats Nino.
- Le contenu et les états proviennent exclusivement de l'API Nino.

## Approved direction

- Choix explicite de l'utilisateur : retour à l’ancienne DA Nino disponible dans `.backup`, sobre et proche des conventions Netflix.
- Header horizontal minimal, hero cinématographique, rails simples et flux Flashy vertical.
- Palette historique : noir neutre et dégradé corail–orange du logo.
- Exception explicite : conserver sans changement le Top 10 de la refonte V8.
- Exception navigation du 6 novembre 2026 : refonte de tous les menus et regroupements raisonnables, avec modales et JavaScript autorisés. Cette demande remplace la restriction V7 pour les menus uniquement ; elle prolonge le monde Nino existant sans nouvelle imagerie ni remplacement global d’identité.
- Validation visuelle : `.impeccable/screenshots/home-desktop.png`, `.impeccable/screenshots/home-mobile.png`, `.impeccable/screenshots/flashy-desktop.png`, `.impeccable/screenshots/flashy-mobile.png`.

## Implementation inventory

| Élément | Engagement de composition | Médium |
| --- | --- | --- |
| Navigation | header Accueil / Explorer / Flashy ; Explorer regroupe Vidéos et Séries ; recherche et profil compacts ; barre mobile Accueil / Recherche / Flashy / Explorer | liens natifs + menu partagé + HTML/CSS + Lucide |
| Compte | modale « Votre espace », identité réelle, cinq destinations publiques, profils, Studio réservé aux administrateurs, déconnexion et reprise après erreur | dialogue natif + API existante |
| Menus partagés | commandes, liens et choix sélectionnés ; focus clavier, recherche par frappe, portail borné au viewport et compatible plein écran | composant `Menu` |
| Réglages de lecture | qualité et vitesse regroupées ; qualité affichée uniquement avec plusieurs variantes ; sélection active visible | menu partagé + lecteur existant |
| Marque | logos Nino complets et compacts | assets existants `public/` |
| Hero | image plein cadre, scrims fonctionnels, titre et actions au premier plan | image API + HTML/CSS |
| Top 10 | grands chiffres corail et affiches classées horizontalement | données API + HTML/CSS |
| Catégories | facettes issues des genres réels | données API + HTML/CSS |
| Rails | cartes 16:9, cartes 9:16 pour Flashy, progression et direct | données API + `next/image` |
| Flashy | un contenu vertical par viewport, défilement à accrochage | HTML/CSS scroll snap |

## Constraints

- Focus visible, navigation native clavier/télécommande et réduction des animations.
- Aucun compteur social, classement ou contenu inventé côté frontend.
- États chargement, erreur et vide conservés.
- Les dialogues natifs contiennent le focus, rendent l’arrière-plan inerte et restituent le focus à la fermeture ; Échap et Retour sont pris en charge.
- Le compte conserve ses liens quand le profil est absent ou que ses informations échouent ; erreur avec nouvelle tentative, avatar de repli et absence de commande Studio pour un compte non administrateur.

## Validation de la navigation

- Revue finale : **ship**, aucun finding matériel ouvert.
- Preuves : `../nino-backend/docs/evidence/navigation/results.json`, 12 groupes de vérifications réussis et 25 captures ; largeurs 375, 430, 768, 1440 et 1920px, clavier, 100 touches directionnelles simulées, focus modal, réduction des animations et réglages réels du lecteur.
- Périmètre : Chrome headless sur le frontend réel avec réponses API interceptées. Ces preuves ne valident ni backend réel, ni SSO/fournisseur réel, ni téléviseur physique ; les contrats API sont inchangés.
