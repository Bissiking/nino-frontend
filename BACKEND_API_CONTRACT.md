# Contrat API attendu par Nino Frontend

Ce document peut être transmis tel quel à Codex dans le dépôt backend.

Il décrit :

- le contrat réellement consommé par le frontend Nino ;
- les routes complémentaires déjà présentes dans le backend ;
- les validations, permissions et formats de réponse attendus ;
- les écarts importants à traiter côté backend.

## Objectif pour Codex backend

Implémenter ou vérifier toutes les routes décrites ci-dessous sans modifier leur chemin ni la forme JSON attendue. Toute évolution incompatible doit être coordonnée avec le frontend.

Le frontend utilise la variable suivante :

```env
NEXT_PUBLIC_NINO_API_URL=http://localhost:8000
```

Le préfixe principal est :

```text
/api/v1
```

## Version du produit et compatibilité

La version minimale attendue du backend est :

```text
8.0.0
```

Règles de versionnement :

- utiliser le versionnement sémantique `MAJOR.MINOR.PATCH` ;
- `MAJOR` change lorsqu'un contrat devient incompatible ;
- `MINOR` change lorsqu'une fonctionnalité ou une route rétrocompatible est ajoutée ;
- `PATCH` change pour une correction rétrocompatible ;
- la version déclarée par FastAPI dans OpenAPI et celle retournée par `/health` doivent être identiques ;
- le backend ne doit jamais annoncer une version inférieure à `8.0.0` ;
- le préfixe `/api/v1` désigne la version du contrat HTTP et reste indépendant de la version produit `8.x.x`.

Version initiale demandée pour la livraison :

```python
FastAPI(title="Nino Backend", version="8.0.0", openapi_url="/api/v1/openapi.json")
```

## Règles globales

### Authentification

Toutes les routes `/api/v1/*` exigent un access token, sauf :

- `POST /api/v1/auth/login` ;
- `POST /api/v1/auth/refresh`.

En-tête attendu :

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Les routes `/api/v1/admin/*` exigent en plus `is_admin: true`.

### Réponse JSON de succès

Toutes les réponses JSON doivent utiliser cette enveloppe :

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`data` peut être un objet, un tableau ou `null`. `meta` doit toujours être un objet.

### Réponse JSON d'erreur

```json
{
  "success": false,
  "error": {
    "code": "MEDIA_NOT_FOUND",
    "message": "Le contenu demandé est introuvable.",
    "details": {}
  }
}
```

Le frontend lit directement `error.code`, `error.message` et `error.details`.

### Codes HTTP et erreurs communes

| HTTP | Code API | Cas attendu |
|---:|---|---|
| 400 | `BAD_REQUEST` | Requête sémantiquement invalide |
| 401 | `AUTH_REQUIRED` | En-tête Bearer absent |
| 401 | `AUTH_INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| 401 | `INVALID_TOKEN` | Token invalide, expiré ou du mauvais type |
| 401 | `AUTH_USER_NOT_FOUND` | Utilisateur du token supprimé ou introuvable |
| 403 | `ACCESS_DENIED` | Accès administrateur ou profil non autorisé |
| 404 | `MEDIA_NOT_FOUND` | Média demandé introuvable |
| 404 | `PROFILE_NOT_FOUND` | Profil demandé introuvable |
| 409 | `MEDIA_UNAVAILABLE` | Média connu mais non lisible actuellement |
| 422 | `VALIDATION_ERROR` | Validation des paramètres ou du JSON échouée |
| 500 | `SERVER_ERROR` | Erreur interne non exposée au client |

Exemple de validation :

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La requête est invalide.",
    "details": {
      "errors": []
    }
  }
}
```

### CORS

Autoriser explicitement l'origine du frontend configurée en développement et en production. Les en-têtes `Authorization` et `Content-Type` doivent être acceptés.

## Schémas partagés

### TokenPair

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Matheo",
  "is_admin": false
}
```

### Profile

```json
{
  "id": "uuid",
  "name": "Matheo",
  "avatar": "/avatars/default.svg",
  "maturity_level": "all",
  "language": "fr"
}
```

`avatar` peut être `null`.

### MediaItem

```json
{
  "id": "uuid",
  "kind": "series",
  "title": "Les Archives Nino",
  "synopsis": "Description du programme.",
  "year": 2026,
  "duration_seconds": 2760,
  "genres": ["Gaming", "Aventure"],
  "poster_url": "https://cdn.example.com/posters/media-id.webp",
  "backdrop_url": "https://cdn.example.com/backdrops/media-id.webp",
  "rating": 8.8,
  "is_available": true,
  "progress_percent": 42.5
}
```

Contraintes attendues :

- `kind` : `movie`, `series`, `short` ou `live` ;
- `year`, `poster_url`, `backdrop_url` et `rating` peuvent être `null` ;
- `genres` est toujours un tableau, éventuellement vide ;
- `duration_seconds >= 0` ;
- `progress_percent` est compris entre `0` et `100` ;
- les URLs d'images doivent être directement accessibles par Next Image ou provenir d'un domaine autorisé côté frontend.

### HomeRail

```json
{
  "id": "top10",
  "title": "Top 10 cette semaine",
  "items": []
}
```

IDs utilisés par l'interface :

| ID | Usage frontend |
|---|---|
| `continue` | Reprendre une lecture |
| `top10` | Classement Top 10 |
| `latest` | Derniers ajouts ; doit exister même vide |
| `movies` | Émissions et concepts |
| `series` | Séries gaming |
| `shorts` | Rail Flashy au format vertical |
| `live` | Émissions en direct |

## Routes nécessaires au frontend

### `POST /api/v1/auth/login`

Authentification publique.

Corps :

```json
{
  "email": "admin@nino.local",
  "password": "nino-admin"
}
```

Validation : email normalisé en minuscules ; mot de passe d'au moins 4 caractères.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "access_token": "access-token",
    "refresh_token": "refresh-token",
    "token_type": "bearer"
  },
  "meta": {}
}
```

Erreur principale : `401 AUTH_INVALID_CREDENTIALS`.

### `POST /api/v1/auth/refresh`

Renouvelle une paire de tokens.

Corps :

```json
{
  "refresh_token": "refresh-token"
}
```

Réponse `200` : même `TokenPair` que la connexion.

Erreur principale : `401 INVALID_TOKEN`.

Cette route existe côté backend mais le frontend ne renouvelle pas encore automatiquement sa session.

### `GET /api/v1/me`

Retourne l'utilisateur authentifié.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "admin@nino.local",
    "display_name": "Admin Nino",
    "is_admin": true
  },
  "meta": {}
}
```

### `GET /api/v1/profiles`

Retourne uniquement les profils appartenant à l'utilisateur authentifié.

Réponse `200` :

```json
{
  "success": true,
  "data": [
    {
      "id": "profile-uuid",
      "name": "Matheo",
      "avatar": "/avatars/default.svg",
      "maturity_level": "all",
      "language": "fr"
    }
  ],
  "meta": {}
}
```

Un utilisateur sans profil reçoit `data: []`.

### `GET /api/v1/home?profile_id={profile_id}`

Construit l'accueil éditorial du profil.

`profile_id` est facultatif, mais s'il est fourni le backend doit vérifier qu'il appartient à l'utilisateur authentifié.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "hero": {
      "id": "media-uuid",
      "kind": "live",
      "title": "Nino Live",
      "synopsis": "Le direct de Nino.",
      "year": 2026,
      "duration_seconds": 0,
      "genres": ["Live"],
      "poster_url": "https://cdn.example.com/poster.webp",
      "backdrop_url": "https://cdn.example.com/backdrop.webp",
      "rating": 8.1,
      "is_available": true,
      "progress_percent": 0
    },
    "rails": [
      { "id": "continue", "title": "Continuer", "items": [] },
      { "id": "top10", "title": "Top 10 cette semaine", "items": [] },
      { "id": "latest", "title": "Derniers ajouts", "items": [] },
      { "id": "movies", "title": "Émissions et concepts", "items": [] },
      { "id": "series", "title": "Séries gaming", "items": [] },
      { "id": "shorts", "title": "Flashy", "items": [] },
      { "id": "live", "title": "En direct", "items": [] }
    ]
  },
  "meta": {}
}
```

Règles :

- `hero` peut être `null` si le catalogue est vide ;
- `top10.items` contient au maximum 10 médias disponibles, triés par note décroissante puis date d'ajout décroissante ;
- `continue.items` contient uniquement les médias dont `progress_percent > 0` ;
- le progrès doit être celui du profil demandé ;
- les rails connus doivent être retournés avec `items: []` lorsqu'ils sont vides ;
- ne jamais exposer la progression d'un autre profil.

### `GET /api/v1/media`

Liste paginée du catalogue.

Paramètres :

| Paramètre | Type | Défaut | Contraintes |
|---|---|---:|---|
| `kind` | string optionnelle | — | `movie`, `series`, `short`, `live` |
| `page` | integer | `1` | minimum `1` |
| `page_size` | integer | `24` | de `1` à `50` |
| `profile_id` | UUID optionnel | — | doit appartenir à l'utilisateur |

Exemple Flashy :

```http
GET /api/v1/media?kind=short&profile_id=profile-uuid
```

Réponse `200` :

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 24,
    "total": 0
  }
}
```

Le frontend actuel consomme directement `data` comme `MediaItem[]` et tolère les métadonnées de pagination dans `meta`.

### `GET /api/v1/media/{media_id}?profile_id={profile_id}`

Retourne un `MediaItem` complet. `progress_percent` doit être calculé pour le profil demandé et autorisé.

Réponse `200` : enveloppe contenant un `MediaItem`.

Erreurs :

- `404 MEDIA_NOT_FOUND` ;
- `403 ACCESS_DENIED` si le profil appartient à un autre utilisateur.

### `GET /api/v1/search?q={query}`

Recherche authentifiée dans le titre, le synopsis et les genres.

Contraintes :

- `q` : chaîne de 0 à 120 caractères ;
- moins de 2 caractères utiles retourne un tableau vide ;
- maximum recommandé : 20 résultats ;
- ordre stable et déterministe.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "query": "gaming",
    "items": []
  },
  "meta": {}
}
```

### `GET /api/v1/stream/{media_id}/decision`

Décide comment le lecteur doit lire le contenu.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "media_id": "media-uuid",
    "mode": "direct_play",
    "url": "/api/v1/stream/media-uuid/direct",
    "mime_type": "video/mp4",
    "expires_in": 900,
    "reason": "Fichier compatible avec le lecteur annoncé."
  },
  "meta": {}
}
```

Erreurs :

- `404 MEDIA_NOT_FOUND` ;
- `409 MEDIA_UNAVAILABLE`.

Valeurs cibles de `mode` à stabiliser côté backend : `direct_play`, `transcode` ou `live`.

### `GET /api/v1/stream/{media_id}/direct`

État actuel du backend : cette route retourne encore un placeholder JSON.

Contrat cible pour une vraie lecture :

- retourner le contenu vidéo avec le `Content-Type` annoncé par la décision ;
- supporter `Range` et répondre `206 Partial Content` ;
- fournir `Accept-Ranges`, `Content-Range` et `Content-Length` ;
- refuser un média absent ou indisponible ;
- ne jamais exposer un chemin local du serveur ;
- utiliser une URL signée courte ou une stratégie compatible avec le lecteur, car un élément `<video src>` n'ajoute pas automatiquement l'en-tête Bearer du client API.

Tant que le streaming réel n'est pas branché, la réponse actuelle est :

```json
{
  "success": true,
  "data": {
    "media_id": "media-uuid",
    "status": "placeholder",
    "message": "Le service de fichiers vidéo sera branché ici."
  },
  "meta": {}
}
```

### `POST /api/v1/media/{media_id}/progress`

Enregistre l'avancement d'un profil.

Corps :

```json
{
  "profile_id": "profile-uuid",
  "position_seconds": 1320,
  "duration_seconds": 2760,
  "device": "web"
}
```

Validation :

- le profil appartient à l'utilisateur authentifié ;
- `position_seconds >= 0` ;
- `duration_seconds >= 0` ;
- `device` est facultatif, maximum 120 caractères ;
- le pourcentage est borné entre `0` et `100` ;
- idéalement, rejeter ou normaliser une position supérieure à la durée.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "media_id": "media-uuid",
    "profile_id": "profile-uuid",
    "percent": 47.83
  },
  "meta": {}
}
```

### `GET /api/v1/notifications?profile_id={profile_id}`

Retourne au maximum 20 notifications, de la plus récente à la plus ancienne.

Le profil doit appartenir à l'utilisateur authentifié. Inclure les notifications globales dont `profile_id` vaut `null`.

Réponse `200` :

```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid",
      "title": "Nino est prêt",
      "message": "Une nouvelle émission est disponible.",
      "level": "success",
      "is_read": false,
      "created_at": "2026-08-03T16:30:00Z"
    }
  ],
  "meta": {}
}
```

Valeurs recommandées de `level` : `info`, `success`, `warning`, `error`.

### `GET /api/v1/admin/stats`

Réservé aux administrateurs.

Réponse `200` :

```json
{
  "success": true,
  "data": {
    "users": 4,
    "libraries": 2,
    "media": 183,
    "transcode_jobs": 0,
    "scan_jobs": 0
  },
  "meta": {}
}
```

Tous les compteurs sont des entiers supérieurs ou égaux à zéro.

### `GET /api/v1/admin/libraries`

Réservé aux administrateurs.

Réponse `200` :

```json
{
  "success": true,
  "data": [
    {
      "id": "library-uuid",
      "name": "Créations Nino",
      "kind": "shows",
      "path": "/media/nino",
      "is_enabled": true,
      "last_scan_at": "2026-08-03T15:00:00Z"
    }
  ],
  "meta": {}
}
```

`last_scan_at` peut être `null`. Cette route n'est pas encore affichée par le frontend actuel.

## Routes techniques

### `GET /health`

Publique, sans authentification.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "nino-backend",
    "version": "8.0.0"
  },
  "meta": {}
}
```

### `GET /api/v1/openapi.json`

Schéma OpenAPI généré par FastAPI. Il doit rester activé pour faciliter l'alignement frontend/backend et la génération de clients typés. Le champ `info.version` doit contenir `8.0.0` au minimum et rester identique à la version exposée par `/health`.

## Priorités demandées au Codex backend

1. Conserver exactement l'enveloppe `success/data/meta` et `success/error`.
2. Garantir les IDs de rails nécessaires à l'accueil, en particulier `top10`, `latest`, `shorts` et `live`.
3. Vérifier l'appartenance de chaque `profile_id` à l'utilisateur authentifié.
4. Valider `kind` avec une enum au lieu d'accepter n'importe quelle chaîne.
5. Stabiliser les valeurs de `mode` et le mécanisme d'authentification du streaming.
6. Transformer `/stream/{media_id}/direct` en véritable réponse vidéo avec support HTTP Range.
7. Ajouter des tests de permissions, profils croisés, pagination, erreurs média et progression.
8. Maintenir `docs/api.md` et OpenAPI alignés avec ce contrat.
9. Initialiser la version produit à `8.0.0` minimum et appliquer SemVer aux versions suivantes.

## Critères d'acceptation minimaux

- connexion puis accès à `/home` avec Bearer fonctionnels ;
- réponse `/home` valide avec catalogue rempli et vide ;
- Top 10 limité à 10 éléments et correctement trié ;
- `GET /media?kind=short` alimente Flashy ;
- recherche vide, sans résultat et avec résultats ;
- détail et décision de lecture d'un média disponible ;
- erreurs `MEDIA_NOT_FOUND` et `MEDIA_UNAVAILABLE` ;
- progression isolée par profil ;
- utilisateur non-admin refusé sur `/admin/*` ;
- aucun utilisateur ne peut lire ou modifier les données d'un profil qui ne lui appartient pas ;
- réponses de validation toujours conformes à l'enveloppe d'erreur Nino.
