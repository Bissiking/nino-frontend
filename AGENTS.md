# AGENTS.md — Nino Frontend

## Projet

Ce dépôt contient le frontend de Nino V8.

Nino est composé de deux dépôts distincts :

- frontend ;
- backend.

Codex doit considérer les deux dépôts comme un seul produit.

## Contexte obligatoire

Avant toute modification importante, lire :

```text
NINO_CODEX_CONTEXT.md
```

Si le fichier n’existe pas dans ce dépôt, le récupérer depuis le dépôt backend ou depuis la source documentaire configurée.

## Accès à l’autre dépôt

Lorsque la tâche utilise ou modifie :

- un endpoint ;
- un schéma JSON ;
- un modèle ;
- une permission ;
- un comportement de lecture ;
- un format d’erreur ;
- une pagination ;
- une authentification ;
- une donnée absente ou ambiguë ;

Codex doit analyser le dépôt backend avant de finaliser la modification.

## Règles frontend

- Ne jamais inventer un endpoint ou une réponse API.
- Vérifier le backend réel.
- Respecter l’architecture actuelle.
- Réutiliser les composants existants.
- Maintenir une couche API centralisée.
- Éviter de dupliquer la logique métier du backend.
- Prévoir chargement, vide, erreur, accès refusé et perte de connexion.
- Préserver la navigation clavier et télécommande.
- Conserver un focus visible.
- Vérifier desktop, mobile, tablette et télévision.
- Éviter les interfaces génériques et les composants incohérents.
- Maintenir les types alignés avec l’API.
- Ajouter ou adapter les tests.
- Vérifier les performances.
- Ne jamais annoncer un test comme réussi sans l’avoir exécuté.

## Ordre de travail recommandé

1. analyser le besoin ;
2. analyser le frontend ;
3. analyser le backend si nécessaire ;
4. identifier les contrats d’API ;
5. vérifier les états UX ;
6. proposer les modifications ;
7. implémenter ;
8. exécuter les tests ;
9. vérifier responsive, clavier et TV ;
10. résumer clairement les résultats.

## Format final attendu

```text
Modifications réalisées
Tests exécutés
Tests non exécutés
Impacts backend
États UX couverts
Risques restants
```
