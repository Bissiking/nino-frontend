# Nino Frontend

Frontend Next.js App Router de Nino V8. Toute la logique metier reste cote backend ; ce projet affiche les donnees, les etats UI et les actions utilisateur.

## Demarrage

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Variables :

- `NEXT_PUBLIC_NINO_API_URL=http://localhost:8000`

## Routes

- `/login` connexion
- `/profiles` selection du profil
- `/` accueil avec hero et rails
- `/search` recherche globale
- `/watch/[id]` surface lecteur
- `/admin` supervision initiale

## Qualite

```powershell
npm run typecheck
npm run build
```
