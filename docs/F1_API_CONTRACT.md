# Contrat F1 — frontend/backend Nino V9

28 octobre 2026. Branches frontend `feat/v9-quality` (base `2c65c20d34a4cb0780d11e037e7794c8e0df2abc`), backend `feat/v9-bootstrap-quality` (base `e7230fe9f1cad67d6f5b3b9981e1a63c4e088d0f`), changements locaux non commités, aucun déploiement. [Rapport détaillé](../../nino-backend/docs/F1_FOUNDATIONS.md), [roadmap](../../nino-backend/docs/ROADMAP_V9.md), [API actuelle](../../nino-backend/docs/api.md).

## Profils et médias

Le choix de profil adulte est un simple réglage **+18 autorisé**, sans PIN ni réauthentification, selon décision utilisateur. `all` autorise +18 ; `teen` et `kids` restent compatibles sans +18. Nouveau profil = `teen`. Si un compte n'a aucun profil, le backend en crée un automatiquement sans +18 ; l'écran de sélection conserve son fonctionnement V8. Aucun profil existant n'est réinitialisé.

La couche `lib/api.ts` transmet par défaut `getProfileId()` à toutes les lectures publiques concernées, notamment recherche, décision du lecteur, Flashy/miniature et commentaires. Un paramètre explicite peut remplacer le profil courant. Si aucun ID n'est disponible, le serveur résout son profil par défaut ; un ID explicitement invalide/tiers est refusé, sans nouvelle tentative avec un autre profil.

Les images locales reçues par le catalogue et Studio sont des URLs protégées `/api/v1/stream/.../image/...?...`. `api.assetUrl` les résout comme les autres chemins relatifs ; l'éditeur peut les renvoyer dans un PATCH, le backend stocke leur référence stable. Le montage direct `/media-images` est retiré. Les grants média sont désormais `v2`, avec compte/profil/mode : **les anciens liens v1 sont refusés**. Prévoir de recharger l'interface et de redemander une décision lors du passage des versions liées. Les images externes restent externes.

La préférence +18 ne constitue pas une protection parentale authentifiée. Les grants restent des liens porteurs utilisables selon les droits de leur profil pendant leur validité ; la migration des sessions et le SSO natif v4 restent F5.

## Types et pagination

`types/nino-api.generated.ts` vient de `nino-backend/scripts/export_contract.py`. Il décrit les schémas OpenAPI vérifiés côté backend ; ne pas le modifier à la main. `types/nino.ts` réutilise ces types pour les réponses concernées. L'email utilisateur est nullable ; `StudioShell` possède un repli textuel. Les détails HLS/source Studio sont optionnels dans `MediaItem` public. Retry retourne seulement `id,status`.

Pour actualiser :

```powershell
# Depuis le backend
python scripts/export_contract.py
python scripts/export_contract.py --check
Copy-Item contracts/nino-api.generated.ts ../nino-frontend/types/nino-api.generated.ts
```

Vérifier le diff et publier les PR liées. Le script exporte avec des réglages isolés, sans `.env` ni connexion DB. `api.media(...)` continue de retourner un tableau ; `api.mediaPage(...)` retourne `{data,meta:{page,page_size,total}}`. Les pages V8 ne sont pas refondues ni converties artificiellement en pagination infinie dans F1.

## Vérifications et limites

Exécutés : `npm run test:contracts` **4 réussis**, `npm run lint` **0 erreur/72 avertissements V8**, `npm run typecheck` réussi, `npm run build` réussi. Backend : **197 tests dont 12 PostgreSQL**, génération de contrat vérifiée. Le workflow frontend inclut tests client, lint, types et build sur Node 22 ; exécution distante non réalisée.

Non exécutés : recette navigateur/écran/clavier/lecteur d'écran/TV réelle, E2E et SSO v4 live. Le checkbox +18 garde les sémantiques natives, un libellé associé, une cible de 48px et un focus visible ; la recette visuelle et appareils reste F2/F7. Aucun écran V9 massif ni client Kyros production n'est activé.
