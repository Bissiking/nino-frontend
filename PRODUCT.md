# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nino s'adresse à plusieurs profils au sein d'un même foyer. L'expérience est conçue en priorité pour une utilisation sur télévision, avec un accès également adapté à l'ordinateur et au mobile.

## Product Purpose

Nino est une plateforme personnelle de streaming vidéo qui permet de découvrir et regarder des contenus originaux dans une expérience moderne et unifiée. Elle réunit séries gaming, émissions, concepts vidéo, tests de produits ou d'objets insolites, créations issues des réseaux sociaux, événements en direct et formats courts.

## Positioning

Nino se situe à mi-chemin entre une plateforme de streaming, une chaîne de télévision personnelle et un réseau de créateurs. Contrairement à une médiathèque traditionnelle comme Jellyfin, le produit organise des contenus créatifs et réguliers en émissions, saisons, épisodes et formats courts plutôt que de gérer principalement une collection de films et séries.

## Operating Context

L'utilisateur choisit un profil, découvre les programmes mis en avant, parcourt les émissions et catégories, reprend une lecture, regarde un direct ou explore Flashy dans un flux vertical de vidéos courtes.

## Capabilities and Constraints

- plusieurs profils par foyer ;
- expérience prioritaire pour télévision avec navigation clavier et télécommande ;
- interfaces également adaptées à l'ordinateur et au mobile ;
- séries gaming, émissions, concepts, tests, vidéos sociales et directs ;
- `Flashy` désigne le format court en défilement vertical ;
- les contenus sont organisés en émissions, saisons, épisodes ou formats courts ;
- le frontend consomme le contrat JSON du backend Nino et ne doit pas inventer de données indisponibles.

## Brand Commitments

- nom de marque : Nino ;
- logos officiels : `public/logo_nino.png` et `public/logo_nino_small.png` ;
- la direction artistique doit être construite à partir des couleurs corail et orange du logo ;
- la migration V8 conserve en priorité l’interface et les parcours de Nino V7 disponibles dans `.backup` ;
- les évolutions visuelles se feront ensuite progressivement, surface par surface, sans révolution globale implicite ;
- l’indépendance du frontend et le nouveau backend performant constituent la rupture V8 ; l’apparence n’a pas à matérialiser cette rupture ;
- la section Top 10 de V8 est l’unique exception actuellement conservée à la direction V7 ;
- l’expérience attendue combine une navigation familière de plateforme vidéo, un hero éditorial immersif, des classements Top 10, des catégories et un espace Flashy distinct ;

## Evidence on Hand

- logos officiels disponibles dans `public/` ;
- catalogue, hero et rails fournis par l'API existante ;
- aucun témoignage, chiffre d'audience ou argument commercial ne doit être inventé.

## Product Principles

- faire passer les programmes et leurs créateurs avant la mécanique de bibliothèque ;
- rendre la découverte immédiate depuis la télévision comme sur mobile ;
- donner à Flashy une expérience adaptée au format court sans fragmenter la marque ;
- préserver une navigation simple, visible et prévisible pour chaque profil ;
- exprimer une identité Nino reconnaissable plutôt qu'une imitation littérale d'une autre plateforme.

## Accessibility & Inclusion

La navigation doit rester utilisable au clavier et à la télécommande, avec un focus visible. Les interfaces doivent être lisibles et fonctionnelles sur télévision, ordinateur, tablette et mobile, et respecter la réduction des animations demandée par le système.
