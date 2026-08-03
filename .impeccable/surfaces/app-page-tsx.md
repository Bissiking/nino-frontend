---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/flashy/page.tsx","components/AppShell.tsx","components/HeroConsole.tsx","components/HomeTopTen.tsx","components/CategoryStrip.tsx","components/Rail.tsx","components/MediaCard.tsx","app/globals.css"]
---

## Scope and mode

- Surface: accueil `app/page.tsx` et destination associée `app/flashy/page.tsx`.
- Mode: Operate, expérience de streaming TV-first adaptée au desktop et au mobile.

## Audience, job and content

- Un profil du foyer doit comprendre immédiatement le programme mis en avant, reprendre une lecture, explorer le classement, les catégories et les formats Nino.
- Le contenu et les états proviennent exclusivement de l'API Nino.

## Approved direction

- Choix explicite de l'utilisateur : standard streaming assumé.
- Navigation inspirée des repères YouTube, hero cinématographique de type Netflix, Top 10 horizontal de type Prime Video et flux Flashy vertical de type Shorts/TikTok/Reels.
- Palette issue des logos officiels : fond prune presque noir, corail et orange.
- Validation visuelle : `.impeccable/screenshots/home-desktop.png`, `.impeccable/screenshots/home-mobile.png`, `.impeccable/screenshots/flashy-desktop.png`, `.impeccable/screenshots/flashy-mobile.png`.

## Implementation inventory

| Élément | Engagement de composition | Médium |
| --- | --- | --- |
| Navigation | barre supérieure avec recherche, rail latéral desktop, barre basse mobile | HTML/CSS + Lucide |
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
