---
name: Nino Frontend
description: Une plateforme de streaming sobre, familière et centrée sur les programmes.
colors:
  black: "#0f0f0f"
  black-deep: "#080808"
  surface: "#1a1a1a"
  surface-raised: "#242424"
  ink: "#ffffff"
  muted: "#bfbfbf"
  coral: "#e94b3c"
  orange: "#f17c58"
typography:
  display:
    fontFamily: "Montserrat, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.7rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Roboto, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
  top-ten:
    fontFamily: "Sora Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.35rem, 2vw, 1.8rem)"
    fontWeight: 800
rounded:
  sm: "8px"
  md: "12px"
spacing:
  compact: "12px"
  standard: "24px"
  section: "44px"
---

# Design System: Nino Frontend

## Direction

**North Star : « Nino, simplement »**

La direction de référence est l’ancienne interface Nino présente dans `.backup`. Elle reprend les conventions les plus sobres d’une plateforme de streaming : un header horizontal léger, un hero éditorial plein écran, des rails sans conteneurs décoratifs et une interface noire où les images portent l’essentiel de l’identité.

Nino ne doit pas ressembler à un tableau de bord dans ses surfaces de visionnage. La navigation reste discrète, le contenu domine et le dégradé historique corail–orange ne sert qu’aux actions et petits signaux de marque.

La section Top 10 issue de la refonte V8 est l’exception explicitement conservée : grands chiffres contour corail, affiches verticales et défilement horizontal.

**Règle de migration.** Toute surface qui existait dans Nino V7 doit d’abord retrouver sa composition, ses composants et son comportement V7. Un nouveau step-up visuel ne peut être introduit que par une demande explicite et localisée. V8 désigne d’abord l’architecture indépendante et son backend, pas une nouvelle direction artistique.

## Couleurs

- **Black** (`#0f0f0f`) : fond principal neutre.
- **Deep Black** (`#080808`) : recul et lecteur.
- **Surface** (`#1a1a1a`) : champs et panneaux fonctionnels.
- **Raised Surface** (`#242424`) : survol et sélection.
- **White** (`#ffffff`) : texte principal.
- **Muted** (`#bfbfbf`) : métadonnées.
- **Nino Coral** (`#e94b3c`) et **Nino Orange** (`#f17c58`) : extrémités du dégradé historique.

Le fond reste noir neutre, jamais prune. Le dégradé corail–orange est réservé aux actions principales, à l’avatar par défaut et à quelques états actifs ; il n’est pas utilisé comme décoration de grande surface.

## Typographie

La hiérarchie reprend l’ancienne combinaison Montserrat/Roboto avec des replis Helvetica. Les titres sont nets et compacts ; le texte reste courant et discret. Le hero plafonne à `4rem`, contrairement à la refonte V8 plus démonstrative.

## Layout

Sur desktop et télévision, le header horizontal de `72px` survole le hero. Il contient le logo, les destinations principales sous forme de liens texte et les actions de profil/Studio. Il n’y a pas de sidebar pour les surfaces de visionnage.

Le hero occupe environ `85vh`, avec le contenu aligné en bas à gauche. Les rails suivent avec des espacements généreux, sans panneaux englobants. Les cartes sont en 16:9 et Flashy reste en 9:16.

Sur mobile, le header se réduit au logo et au profil, tandis que quatre destinations restent accessibles dans la barre inférieure. Les rails restent horizontaux et tactiles.

Nino Studio conserve sa structure de régie compacte, mais adopte les noirs neutres, la typographie et les contrôles de cette direction.

## Composants

### Navigation

- header transparent au-dessus du hero, noir sur les surfaces fonctionnelles ;
- liens texte blancs atténués, soulignement corail–orange pour l’état actif ;
- cibles interactives de 42px minimum et focus blanc très visible ;
- barre inférieure mobile conservée.

Le bouton profil ouvre le menu modal centré de V7 : identité du profil, navigation, administration disponible et déconnexion. Il ne mène pas directement à la page des profils.

### Hero

- image plein cadre ;
- double scrim noir horizontal et vertical ;
- titre limité, synopsis de trois lignes maximum sur mobile ;
- boutons simples, primaire en dégradé historique et secondaire translucide ;
- aucun eyebrow ou label décoratif au-dessus du titre.

### Cartes et rails

- cartes 16:9 sans conteneur externe ;
- rayon `12px`, bordure presque invisible ;
- titre et métadonnées sous l’image ;
- léger agrandissement au survol/focus, avec ombre noire douce ;
- progression corail collée au bas de l’image.

### Catégories

Les catégories sont des filtres compacts sur une seule ligne scrollable, pas une grille de gros blocs décoratifs.

### Top 10

Conserver le composant V8 actuel : grands chiffres creux `#ff5264`, fond de chiffre `#0d0b0f`, affiches verticales et copie superposée. Les changements globaux de palette ne doivent pas modifier cette section.

### Nino Studio

Studio reprend le tableau de bord V7 : navigation horizontale, indicateurs compacts, panneaux noirs et workflow d’upload en étapes. L’import conserve le drag-and-drop, le choix fichier/HLS, les métadonnées, la publication, les visuels, l’aperçu du fichier et les états d’envoi. Les appels et validations restent ceux du backend V8.

## Règles

- Laisser les visuels réels du catalogue créer l’atmosphère.
- Préserver chargement, vide, erreur, perte de connexion et accès refusé.
- Garder un focus visible au clavier et à la télécommande.
- Ne pas réintroduire une sidebar dans l’expérience de visionnage.
- Ne pas employer de fond prune, de grosses capsules de recherche ou de tuiles de catégories décoratives.
- Ne pas modifier la section Top 10 sans une nouvelle demande explicite.
