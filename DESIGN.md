---
name: Nino Frontend
description: Une salle de diffusion personnelle, cinématographique et pensée pour la télévision.
colors:
  viewing-room: "#0d0b0f"
  viewing-room-deep: "#080709"
  surface: "#18151a"
  surface-raised: "#242026"
  surface-hover: "#302a32"
  ink: "#fff8f4"
  muted: "#b9adb7"
  coral: "#ff5264"
  orange: "#ff8128"
typography:
  display:
    fontFamily: "Sora Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(3rem, 5.4vw, 5.8rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Sora Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  sm: "10px"
  md: "14px"
spacing:
  compact: "12px"
  standard: "24px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.viewing-room-deep}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "rgba(255, 248, 244, 0.16)"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "48px"
---

# Design System: Nino Frontend

## Overview

**Creative North Star: "La salle de diffusion Nino"**

Nino place les programmes et leurs créateurs au premier plan dans une salle de visionnage sombre et chaleureuse. Le cadre reprend des repères immédiatement compris sur télévision — hero cinématographique, navigation latérale, rails et classement — puis les unifie avec le corail et l’orange du logo.

L’interface reste dense mais lisible, avec peu de chrome et des images qui portent la hiérarchie. Les commandes sont grandes, prévisibles et toujours atteignables au clavier ou à la télécommande.

**Key Characteristics:**

- hero éditorial immersif et image-led ;
- navigation vidéo compacte sur desktop, barre inférieure sur mobile ;
- classement Top 10 à chiffres contour corail ;
- surfaces prune-noir, accents corail et orange ;
- focus orange très visible.

## Colors

La palette associe des noirs légèrement prune à un corail énergique, avec l’orange réservé aux signaux secondaires et au focus.

- **Viewing Room** (`#0d0b0f`) : fond principal.
- **Deep Viewing Room** (`#080709`) : navigation et zones de recul.
- **Surface** (`#18151a`) : champs, catégories et blocs fonctionnels.
- **Raised Surface** (`#242026`) : sélection et état actif.
- **Warm Ink** (`#fff8f4`) : texte principal.
- **Muted Mauve** (`#b9adb7`) : métadonnées et texte secondaire.
- **Nino Coral** (`#ff5264`) : actions, profil, progression et identité.
- **Nino Orange** (`#ff8128`) : focus, notation et accent complémentaire.

**The Signal Rule.** Le corail indique l’action ou la marque ; l’orange attire l’attention sur le focus et les informations de rang, jamais sur de grandes surfaces décoratives.

## Typography

**Display Font:** Sora Variable, avec Helvetica Neue, Helvetica et Arial en repli.
**Body Font:** Sora Variable, avec Helvetica Neue, Helvetica et Arial en repli.

La typographie est directe, compacte et conçue pour rester lisible à distance. Les titres sont lourds et serrés ; les synopsis gardent une mesure courte.

- **Display** (800, `clamp(3rem, 5.4vw, 5.8rem)`, 1.02) : titres de hero.
- **Title** (800, `clamp(1.35rem, 2vw, 1.8rem)`) : titres de rails et pages.
- **Body** (400, `1rem`, 1.55) : synopsis et textes fonctionnels.
- **Label** (800, `0.72rem–0.9rem`) : métadonnées, badges et navigation.

## Layout

Desktop utilise un shell de `224px` avec une top bar de `70px`. Le hero occupe jusqu’à 68vh, puis le catalogue suit un rythme de section de `48px`. Les rails sont horizontaux et scroll-snap. Entre 761px et 1100px, la sidebar se réduit aux icônes. À 760px et moins, elle devient une barre inférieure à quatre destinations, le hero passe en composition verticale et les rails affichent des cartes larges adaptées au geste tactile.

## Elevation & Depth

Le système est plat par défaut. La profondeur vient des niveaux de noir, des scrims sur les images et d’une ombre douce uniquement lorsque les cartes sont survolées ou focalisées. Le hero utilise `0 24px 70px rgba(0,0,0,.38)` lorsque le contexte demande une séparation.

## Shapes

Les contrôles et catégories utilisent 10px de rayon ; les médias et panneaux 14px. Les avatars et boutons icônes restent circulaires. Les badges d’état sont plus serrés, avec 6px. Les grandes capsules sont réservées à la recherche globale.

## Components

### Buttons

- Le bouton primaire est corail, haut de 48px et très contrasté.
- Le secondaire utilise un voile blanc translucide sur l’image du hero.
- Le focus est un contour orange de 3px avec un décalage de 4px.

### Cards / Containers

- Les cartes média sont en 16:9 ; Flashy utilise 9:16.
- Elles restent sans cadre et se soulèvent légèrement au survol ou au focus.
- La progression est une ligne corail de 4px collée au bas de l’image.

### Navigation

- La top bar porte la marque, la recherche et le profil.
- La sidebar reprend une densité de plateforme vidéo, avec icône et libellé.
- L’état actif utilise une surface relevée et une icône corail.
- Sur mobile, quatre destinations restent visibles dans la barre inférieure.

### Top 10

Le classement associe de grands chiffres creux corail à des vignettes verticales. Il reste horizontal et scrollable pour préserver une lecture rapide sur télévision comme au tactile.

### Flashy

Le flux court occupe une colonne 9:16 centrée avec scroll-snap vertical. Les titres et actions sont placés dans un scrim bas pour rester lisibles sans masquer la vidéo.

## Do's and Don'ts

### Do:

- **Do** laisser les visuels réels du catalogue porter l’atmosphère.
- **Do** garder les cibles d’action à au moins 42–48px.
- **Do** vérifier le focus clavier et télécommande sur chaque lien interactif.
- **Do** conserver les états chargement, vide, erreur et connexion perdue.

### Don't:

- **Don't** réintroduire le vert phosphore de l’ancien univers signal-console.
- **Don't** empiler des panneaux encadrés autour des contenus média.
- **Don't** masquer la navigation principale derrière un menu sur télévision.
- **Don't** utiliser corail et orange comme remplissage décoratif simultané.
