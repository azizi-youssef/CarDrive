# CarDrive — Architecture Monorepo

```
CarDrive/
├── frontend/          ← Next.js 16 — UI, pages, composants
│   ├── src/
│   │   ├── app/       ← Pages & routes (App Router)
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api/   ← Clients HTTP vers le backend
│   │   │   └── utils.ts
│   │   └── types/
│   ├── .env.local     ← NEXT_PUBLIC_API_URL=http://localhost:4000
│   └── package.json
│
├── backend/           ← Express.js — API REST
│   ├── src/
│   │   ├── routes/    ← vehicles, agencies, bookings, reviews, stats
│   │   ├── services/  ← store.ts + mockData.ts
│   │   ├── middleware/← validate.middleware.ts
│   │   ├── validations/
│   │   ├── availability/
│   │   └── index.ts   ← Point d'entrée (port 4000)
│   ├── .env           ← PORT=4000, FRONTEND_URL=...
│   └── package.json
│
├── supabase/          ← SQL schemas (commun)
└── package.json       ← Monorepo root (workspaces)
```

## Démarrage rapide

```bash
# Démarrer les deux serveurs en parallèle
npm run dev

# Frontend uniquement (port 3000)
npm run dev:frontend

# Backend uniquement (port 4000)
npm run dev:backend
```

## Endpoints API (backend :4000)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Vérification santé |
| GET | `/api/vehicles` | Liste avec filtres |
| GET | `/api/vehicles/:slug` | Détail véhicule |
| PATCH | `/api/vehicles/:id` | Mise à jour |
| DELETE | `/api/vehicles/:id` | Suppression |
| GET | `/api/agencies` | Liste agences |
| GET | `/api/agencies/:slug` | Détail agence |
| GET | `/api/agencies/:slug/vehicles` | Véhicules de l'agence |
| GET | `/api/bookings` | Liste réservations |
| POST | `/api/bookings` | Créer réservation |
| PATCH | `/api/bookings/:id/status` | Changer statut |
| GET | `/api/reviews?vehicleId=` | Avis véhicule |
| POST | `/api/reviews` | Ajouter avis |
| GET | `/api/stats/admin` | Stats admin |
| GET | `/api/stats/agency/:id` | Stats agence |

## Variables d'environnement

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**backend/.env**
```
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```
