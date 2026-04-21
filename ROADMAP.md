# Roadmap technique Skalcook

Ce document liste les dettes techniques identifiées et la stratégie d'amélioration. Il reflète l'état du projet à avril 2026.

## Contexte

Skalcook est passé d'un MVP à une V2 en ~6 mois de développement solo. Le codebase fait aujourd'hui ~22 000 lignes (pages) et ~7 000 lignes (composants). La stack est moderne (Next.js 16, React 19, Supabase, Stripe) mais plusieurs dettes techniques ont été contractées pour livrer vite. Ce document les assume et trace leur résolution.

## Priorités

### 🔴 Priorité 1 — Fondations (Q2 2026)

**Objectif :** stabiliser le socle technique avant d'accélérer sur les features.

- [ ] **Migration progressive vers TypeScript**
  - Approche fichier par fichier, en commençant par `lib/`
  - Cible : 100% TS dans 3 mois
  - Gain : IDE plus intelligent, détection de bugs à la compilation

- [ ] **Découpage des fichiers volumineux**
  - 15 fichiers > 500 lignes identifiés, dont :
    - `app/controle-gestion/achats/import/page.js` (1038 l.)
    - `components/VentesImporter.jsx` (993 l.)
    - `app/crm/devis/[id]/page.js` (792 l.)
    - `app/superadmin/utilisateurs/page.js` (791 l.)
  - Cible : aucun fichier > 300 lignes
  - Approche : extraire les sous-composants, hooks custom, helpers

- [ ] **Centralisation des 47 routes API derrière un `apiHandler`**
  - Mutualiser auth, rate limiting, parsing Zod et gestion d'erreurs
  - Éviter la duplication de logique critique (sécurité, audit)

### 🟠 Priorité 2 — Cohérence UI (Q3 2026)

- [ ] **Migration inline styles → Tailwind**
  - ~3700 occurrences de `style={{}}` à remplacer
  - Tailwind est déjà installé, il faut le déployer
  - Commencer par les pages les plus visibles (landing, dashboard, fiches)

- [ ] **Consolidation des primitives UI**
  - Les primitives `Card`, `Button`, `Alert`, `Badge` existent mais sont peu adoptées
  - Cible : 80% des composants utilisent les primitives

- [ ] **Catalogue UI (Storybook ou page `/_styleguide`)**
  - Pour éviter la divergence visuelle au fil du développement

### 🟡 Priorité 3 — Qualité & observabilité (Q4 2026)

- [ ] **Tests unitaires sur les calculs critiques**
  - Vitest est configuré, il manque les tests
  - Cible prioritaire : calculs de marges, ratios food cost, cascade allergènes
  - Objectif de couverture : 60% sur `lib/`

- [ ] **Logger structuré**
  - Remplacer les `console.log` restants par un logger (Pino ou équivalent)
  - Intégration Vercel Logs / Sentry pour le monitoring

- [ ] **Audit a11y**
  - WCAG 2.1 AA sur les parcours critiques
  - Contraste, navigation clavier, labels ARIA

## Choix assumés (YAGNI)

Certaines "bonnes pratiques" ont été écartées volontairement pour garder le projet simple :

- **Pas de state manager global** (Zustand, Redux) : les props + le context Supabase suffisent
- **Pas de monorepo** : application unique, pas de besoin actuel
- **Pas d'ORM** : SQL direct Supabase + migrations versionnées, approche plus lisible
- **Pas de tests E2E exhaustifs** : coverage sur les golden paths suffit à ce stade

Ces choix seront revus si le produit ou l'équipe l'exigent.

## Hygiène déjà en place

- ✅ Migrations Supabase versionnées (`supabase/migrations/`)
- ✅ ESLint configuré
- ✅ Vitest et Playwright configurés
- ✅ `.env.example` à jour
- ✅ Rate limiting Upstash sur les routes sensibles
- ✅ DOMPurify pour la sanitisation
- ✅ CSP via middleware
- ✅ RLS Supabase sur toutes les tables
