# Nino Frontend

Frontend Next.js App Router de Nino V8. La logique métier reste côté backend ; ce projet affiche les données, les états UI et les actions utilisateur.

## Prérequis

- Node.js 20.9 ou supérieur ;
- npm ;
- le [backend Nino](../nino-backend/README.md) démarré et accessible.

## Installation et démarrage

Sous macOS ou Linux :

```bash
npm install
cp .env.example .env
npm run dev
```

Sous PowerShell :

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

L'application est alors disponible sur `http://localhost:3000` avec les valeurs d'exemple.

## Configuration `.env`

Le fichier `.env.example` contient toutes les variables prises en charge par le frontend. Copiez-le vers `.env` pour une configuration partagée localement, ou vers `.env.local` pour des réglages propres à votre machine. Ces fichiers locaux sont ignorés par Git.

| Variable | Défaut | Usage |
| --- | --- | --- |
| `PORT` | `3000` | Port d'écoute utilisé par `npm run dev` et `npm start`. |
| `HOSTNAME` | `0.0.0.0` | Interface réseau d'écoute. Utilisez `127.0.0.1` pour limiter l'accès à la machine locale. |
| `NEXT_PUBLIC_NINO_API_URL` | `http://localhost:8000` | URL publique du backend, sans slash final. Elle est intégrée au code envoyé au navigateur. |
| `NEXT_TELEMETRY_DISABLED` | `1` | Désactive la télémétrie Next.js lorsque la valeur vaut `1`. Optionnel. |

Exemple pour servir Nino sur le port `3100` avec un backend sur le port `8100` :

```env
PORT=3100
HOSTNAME=0.0.0.0
NEXT_PUBLIC_NINO_API_URL=http://localhost:8100
NEXT_TELEMETRY_DISABLED=1
```

Next.js charge les fichiers dans son ordre standard de priorité : variables déjà présentes dans le système, `.env.<environnement>.local`, `.env.local`, `.env.<environnement>`, puis `.env`. Une variable système ou une option passée explicitement en ligne de commande reste donc prioritaire :

```bash
npm run dev -- --port 3200
```

Après un changement de configuration, redémarrez le serveur. En production, `NEXT_PUBLIC_NINO_API_URL` doit être défini avant `npm run build`, car les variables `NEXT_PUBLIC_*` sont intégrées au bundle navigateur pendant la compilation.

### Configuration CORS du backend

Le backend doit autoriser l'origine exacte du frontend. Si vous changez le port en `3100`, adaptez son fichier `.env` :

```env
NINO_CORS_ORIGINS=http://localhost:3100,http://127.0.0.1:3100
```

Puis redémarrez le backend. Le frontend ne modifie pas automatiquement sa configuration.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement avec rechargement à chaud. |
| `npm run build` | Crée le build de production. |
| `npm start` | Sert un build existant avec `PORT` et `HOSTNAME` lus depuis l'environnement. |
| `npm run typecheck` | Vérifie les types TypeScript sans générer de fichiers. |
| `npm run lint` | Exécute le lint Next.js configuré dans le projet. |

Pour lancer la version de production :

```bash
npm run build
npm start
```

## Routes

- `/login` : connexion ;
- `/auth/callback` : finalisation de la connexion SSO Kyros ;
- `/profiles` : sélection du profil ;
- `/` : accueil avec hero et rails ;
- `/search` : recherche globale ;
- `/watch/[id]` : surface lecteur ;
- `/admin` : supervision initiale.

## Vérifications qualité

```bash
npm run typecheck
npm run build
```
