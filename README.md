# Skalcook

SaaS de gestion opérationnelle pour restaurants et traiteurs : fiches techniques, cartes, marges, achats, CRM et devis.

## Stack

- **Framework** : Next.js 16 (App Router) + React 19
- **Base de données** : Supabase (PostgreSQL + RLS) avec migrations versionnées
- **Auth** : Supabase Auth + middleware Next.js
- **Paiements** : Stripe (billing en cours d'intégration)
- **Email transactionnel** : Resend
- **Rate limiting** : Upstash Redis
- **PDF** : `@react-pdf/renderer`
- **Validation** : Zod
- **Sécurité** : DOMPurify, CSP via middleware
- **Tests** : Vitest (unitaires) + Playwright (E2E)
- **Hébergement** : Vercel

## Démarrage rapide

### Pré-requis

- Node.js 20+
- Un projet Supabase (voir `supabase/migrations/` pour le schéma)
- Un compte Stripe (test mode) si tu travailles sur le billing
- Un compte Resend si tu travailles sur les emails

### Installation

```bash
npm install
cp .env.example .env.local
# Éditer .env.local avec les clés de ton propre projet Supabase
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Scripts disponibles

| Script | Rôle |
|---|---|
| `npm run dev` | Lance le serveur de dev Next.js |
| `npm run build` | Build de production |
| `npm run start` | Lance le build de production |
| `npm run lint` | Linter ESLint |
| `npm test` | Tests unitaires Vitest |
| `npm run test:watch` | Vitest en watch mode |
| `npm run test:coverage` | Couverture de code |
| `npm run test:e2e` | Tests E2E Playwright |
| `npm run test:e2e:ui` | Playwright en mode UI |

## Architecture

```
app/                      # Routes Next.js (App Router)
  ├─ api/                 # Routes API (47 endpoints)
  ├─ (auth)/              # Pages d'authentification
  ├─ dashboard/           # Dashboards cuisine / bar
  ├─ fiches/              # Fiches techniques cuisine
  ├─ bar/                 # Module bar (fiches, cartes, dashboard)
  ├─ cartes/              # Cartes (avec food cost et ratios)
  ├─ crm/                 # Module CRM traiteur (clients, devis, événements)
  ├─ controle-gestion/    # Achats, marges, mercuriale
  └─ superadmin/          # Backoffice admin

components/               # Composants React
  ├─ ui/                  # Primitives (Card, Button, Alert, Badge)
  ├─ crm/                 # Composants CRM
  ├─ dashboard/           # Widgets dashboard
  └─ marges/              # Visualisations marges

lib/                      # Utilitaires, hooks, clients
supabase/migrations/      # Migrations SQL versionnées
e2e/                      # Tests Playwright
docs/                     # Documentation interne
```

## Multi-tenant

L'app est multi-tenant : chaque restaurant ("client" en DB) a ses propres données. L'isolation est assurée par :

1. Supabase RLS (Row Level Security) sur toutes les tables
2. Un middleware qui enrichit le contexte avec le `client_id`
3. Une table `acces_clients` qui mappe `user_id` → `client_id` avec un rôle (admin, cuisine, bar)

## Feuille de route technique

Voir [`ROADMAP.md`](./ROADMAP.md) pour les dettes techniques identifiées et le plan d'amélioration.

## Licence

Code propriétaire — tous droits réservés.
