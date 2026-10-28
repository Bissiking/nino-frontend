# Qualité frontend — baseline V9

27 octobre 2026 — branche `feat/v9-quality`, base `2c65c20d34a4cb0780d11e037e7794c8e0df2abc`.

`npm run lint` exécute ESLint 9 avec les configurations officielles Next.js 16 core-web-vitals et TypeScript. `.next`, sorties de build et `next-env.d.ts` sont exclus du lint.

## État mesuré

Le premier passage des règles complètes sur V8 a révélé 44 erreurs et 39 warnings. Les erreurs JSX simples, l'ordre de déclaration de `loadSeries` et la dépendance du callback transcode ont été corrigés. Le rendu du texte et les appels API sont conservés.

Baseline courante : **0 erreur, 72 warnings** :

| Diagnostic | Nombre | Traitement |
|---|---:|---|
| `react-hooks/set-state-in-effect` | 29 | Warnings sur fichiers V8 nommés dans la config ; refactor lors du lot UI concerné |
| `react-hooks/purity` | 4 | Warnings sur MediaPlayer et StudioLibrary existants |
| `@typescript-eslint/no-unused-vars` | 18 | Dette visible à réduire |
| `@next/next/no-img-element` | 14 | Optimisation des images à évaluer selon assets/API/TV |
| Directives eslint-disable devenues inutiles | 6 | Nettoyage à effectuer lors du passage sur ces composants |
| `react-hooks/exhaustive-deps` | 1 | Dépendances à corriger dans l'éditeur série |

`eslint.config.mjs` limite les deux changements de sévérité aux chemins existants concernés. Les routes dynamiques utilisent un glob qui vise les crochets littéraux. Les nouveaux fichiers conservent les sévérités officielles ; pas de désactivation globale des règles Hooks, de sécurité ou d'accessibilité.

`--max-warnings 72` empêche l'augmentation du total. Réduire ce seuil avec la dette ; ne pas l'augmenter pour faire passer une PR. Cette baseline rend les diagnostics exploitables ; elle ne signifie pas que les 72 warnings sont résolus.

## Vérifications du lot

- `npm run lint` : réussi avec les 72 warnings ci-dessus.
- `npm run typecheck -- --incremental false` : réussi.
- `npm run build` standard : réussi, Next.js 16.2.12.
- Workflow `.github/workflows/quality.yml` ajouté : npm ci, lint, typecheck, build sur Node 22. Exécution distante non réalisée dans ce lot.
- Aucun contrat API ou design system modifié ; aucune refonte d'écran, capture/E2E ou qualification TV exécutée.

Suivi produit partagé : [roadmap V9 backend](../../nino-backend/docs/ROADMAP_V9.md), [rapport du lot](../../nino-backend/docs/F1_BOOTSTRAP_QUALITY.md). Les avertissements doivent être traités par les lots de composants/pages auxquels ils appartiennent.

## Complément F1 du 28 octobre 2026

La baseline reste **0 erreur/72 warnings**, typecheck et build Next/Turbopack standard réussis. `npm run test:contracts` ajoute **4 tests verts** exécutant les vrais modules client/session avec transport simulé : profil courant, changement de profil, pagination conservée et refus explicite. Le workflow inclut ces tests ; CI distante non exécutée.

Les contrats F1 modifient maintenant le profil transmis, les URLs d'image locales et les types utilisateur/média/retry. Le constat « aucun contrat modifié » du premier lot ci-dessus reste historique, pas l'état actuel. Lire [le contrat F1](F1_API_CONTRACT.md) et [le rapport backend](../../nino-backend/docs/F1_FOUNDATIONS.md). Pas de recette navigateur/lecteur d'écran/TV réelle ou de SSO v4 live effectuée.
