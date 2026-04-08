# Roadmap V3 — passage de "V1 commerciale" à "production-grade serein"

> Backlog créé après le merge de la PR antonydespaux-bit/skalcook#12
> (V2 — refactor POC → production). À attaquer dans une nouvelle session.

Les items sont classés par priorité business, pas par taille technique.
Format : chaque section peut être créée tel quel comme **issue GitHub**
via `scripts/create-v3-issues.sh`.

---

## 🔴 Critiques — fiabilité prod (à faire dans les 2-3 prochaines semaines)

### #1 Monitoring : intégrer Sentry (client + serveur)

**Pourquoi** : actuellement aucun outil pour détecter les erreurs en prod.
On ne saura qu'un client a un bug que s'il appelle. Inacceptable dès le
deuxième client payant.

**Acceptance criteria**
- [ ] Compte Sentry créé (free tier 5k events/mois suffit)
- [ ] `@sentry/nextjs` installé et configuré (`sentry.client.config.ts`,
      `sentry.server.config.ts`, `sentry.edge.config.ts`)
- [ ] DSN dans les env vars Vercel (pas commit)
- [ ] Source maps uploadées au build (Sentry CLI)
- [ ] Toutes les erreurs `console.error('[API Error]', err)` du `apiHandler`
      sont aussi envoyées à Sentry
- [ ] Tag chaque event avec `client_id` (depuis le contexte d'auth)
      pour pouvoir filtrer par tenant
- [ ] Test : `throw new Error('sentry test')` dans une route → l'event
      apparaît dans le dashboard Sentry sous 1 min

**Effort** : ~2 h
**Labels** : `priority/critical`, `area/observability`, `v3`

---

### #2 Drill de restore base de données + procédure documentée

**Pourquoi** : Supabase fait des backups quotidiens, mais on n'a jamais
testé la restauration. Le jour où on en aura besoin (DROP TABLE accidentel,
client qui veut un rollback, attaque), on ne saura pas faire — et on aura
peur d'essayer.

**Acceptance criteria**
- [ ] Créer une branche Supabase de test
- [ ] Restaurer un backup d'il y a 24 h sur cette branche
- [ ] Vérifier l'intégrité : nb de lignes par table, FK, RLS
- [ ] Documenter la procédure dans `docs/runbooks/restore-database.md` :
      capture d'écran, commandes, durée moyenne, vérifications post-restore
- [ ] Définir l'objectif RPO (acceptable data loss) et RTO (acceptable
      downtime) dans le runbook

**Effort** : ~3 h
**Labels** : `priority/critical`, `area/ops`, `v3`

---

### #3 Brancher Upstash Redis pour le rate limiting multi-instance

**Pourquoi** : `middleware.ts` utilise actuellement un rate-limit en
mémoire (`ipRequests` Map). En multi-instance Vercel le quota est multiplié
par N : un attaquant peut faire 60×N req/min sans être bloqué. Le code
upstash est déjà branché conditionnellement, il n'y a que les env vars à
poser.

**Acceptance criteria**
- [ ] Compte Upstash créé (free tier suffit)
- [ ] Database Redis créée en région EU
- [ ] `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` posés dans
      les env vars Vercel (Production + Preview)
- [ ] Test charge : 70 req/min depuis 2 IPs différentes simultanément
      → blocage à la 60ᵉ req par IP, indépendamment de l'instance
- [ ] Vérifier que le free tier suffit (10k commandes/jour par défaut)

**Effort** : ~30 min
**Labels** : `priority/critical`, `area/security`, `v3`

---

### #4 Tests E2E Playwright sur les parcours critiques

**Pourquoi** : `playwright.config.ts` existe, le dossier `e2e/` existe,
mais aucun test n'est écrit. Sans E2E on ne peut pas shipper en confiance
chaque semaine — chaque PR risque de casser un parcours utilisateur sans
qu'on le sache.

**Acceptance criteria** (5-7 parcours, pas plus pour la V3)
- [ ] Login admin → accès dashboard
- [ ] Création d'une fiche cuisine avec ingrédients → calcul food cost
- [ ] Création d'un inventaire flash → saisie → validation
- [ ] Import facture (parse-facture OCR) → mapping ingrédients → save
- [ ] Export RGPD JSON depuis `/mon-compte`
- [ ] Création d'un user (`/admin`) → invitation envoyée
- [ ] Tous les tests tournent dans la CI sur chaque PR (`vercel.json` ou
      GitHub Actions)
- [ ] Run total < 3 min en CI

**Effort** : 1-2 jours
**Labels** : `priority/critical`, `area/testing`, `v3`

---

## 🟠 Importantes — conformité commerciale (à faire avant les premiers gros contrats)

### #5 Rédiger les CGV (Conditions Générales de Vente)

**Pourquoi** : pour vendre du SaaS B2B, les CGU ne suffisent pas — il faut
des CGV avec : tarifs, modalités de paiement, durée d'engagement, SLA,
responsabilité, résiliation, propriété intellectuelle, juridiction.
Document juridique, pas tech.

**Acceptance criteria**
- [ ] Modèle CGV SaaS B2B fourni par un avocat (ou modèle Avocats Picovschi
      / Captain Contrat / etc.)
- [ ] Adapté à Skalcook : prix, modules, RGPD, durée, etc.
- [ ] Page `/cgv` ajoutée
- [ ] Lien dans les mentions légales et le footer
- [ ] Acceptation explicite à la première création de compte (checkbox
      avec horodatage en BDD, comme `date_cgu` qui existe déjà)

**Effort** : 2-5 jours (dépend de l'avocat)
**Labels** : `priority/high`, `area/legal`, `v3`

---

### #6 Signer un DPA (Data Processing Agreement) avec chaque client

**Pourquoi** : obligation RGPD dès qu'un client te confie des données
personnelles (et tu en stockes : noms, emails, profils utilisateurs).
C'est un contrat de sous-traitance qui décrit ton rôle de processor et
les engagements de sécurité.

**Acceptance criteria**
- [ ] Modèle DPA fourni par un avocat (ou modèle CNIL adapté)
- [ ] Annexe avec liste à jour des sous-traitants : Vercel, Supabase,
      Anthropic (parsing OCR), Upstash, Sentry, Google Analytics
- [ ] Workflow : signature électronique au moment du contrat client
      (DocuSign / Yousign / SignRequest)
- [ ] Stockage du DPA signé pour chaque client (en BDD ou Drive)

**Effort** : 1-2 jours setup + 30 min par client après
**Labels** : `priority/high`, `area/legal`, `v3`

---

### #7 Mettre à jour `app/politique-confidentialite/page.js` avec les sous-traitants

**Pourquoi** : la politique de confidentialité doit lister exhaustivement
les sous-traitants (Vercel, Supabase, Anthropic, etc.) avec leur région
de traitement et le motif du transfert.

**Acceptance criteria**
- [ ] Section "Sous-traitants" ajoutée à `politique-confidentialite/page.js`
- [ ] Tableau : nom, fonction, pays d'hébergement, base légale du transfert
      (clauses contractuelles types pour les transferts hors UE)
- [ ] Section "Conservation des données" : durées par type (factures
      10 ans, comptes utilisateurs jusqu'à résiliation, logs 13 mois)
- [ ] Date de dernière mise à jour visible en haut de page

**Effort** : ~1 h
**Labels** : `priority/high`, `area/legal`, `area/rgpd`, `v3`

---

### #8 Vérifier le statut juridique de l'éditeur

**Pourquoi** : "Skalcook SAS" apparaît dans les mentions légales
(`app/mentions-legales/page.js`). Si la SAS n'est pas immatriculée,
ou n'a pas d'assurance RC pro, vendre du SaaS expose à un risque
personnel direct.

**Acceptance criteria**
- [ ] SIRET vérifié et mentionné dans `mentions-legales/page.js`
- [ ] Assurance RC professionnelle souscrite (couverture cyber +
      atteinte aux données recommandée)
- [ ] Compte bancaire pro
- [ ] Conditions d'éligibilité TVA OK
- [ ] (Optionnel) statut auto-entrepreneur si la SAS n'existe pas encore,
      avec migration prévue

**Effort** : variable (administratif pur)
**Labels** : `priority/high`, `area/legal`, `v3`

---

## 🟡 Nice-to-have — qualité, scale et UX (next iterations)

### #9 Code coverage minimum + badge

**Pourquoi** : il y a des tests mais aucun seuil. Difficile de dire
"on est bien testés" sans chiffre.

**Acceptance criteria**
- [ ] `vitest run --coverage` configuré dans `vitest.config.ts`
      (`coverage: { provider: 'v8', thresholds: { lines: 60, ... } }`)
- [ ] CI bloque si coverage < 60 % sur `lib/services/**` et
      `lib/validators/**`
- [ ] Badge coverage dans le README

**Effort** : ~2 h
**Labels** : `priority/medium`, `area/testing`, `v3`

---

### #10 Page "Activité" plus complète pour les admins clients

**Pourquoi** : `lib/useLog.js` log déjà côté serveur dans `activity_logs`,
et `/admin/logs` existe pour les admins. Améliorer l'UX : filtres par
utilisateur, par type d'action, export CSV, période.

**Acceptance criteria**
- [ ] Filtres : utilisateur, type d'action, période, section
- [ ] Export CSV de la sélection courante
- [ ] Pagination serveur (au lieu de tout charger)
- [ ] Affichage `details` JSON formaté dans une modale

**Effort** : ~1 jour
**Labels** : `priority/medium`, `area/ux`, `v3`

---

### #11 Brancher Stripe pour la facturation

**Pourquoi** : aujourd'hui aucune gestion d'abonnement automatisée.
Si tu signes 5 clients tu factures à la main — OK pour 5, ingérable
au-delà.

**Acceptance criteria**
- [ ] Stripe Customer Portal configuré (les clients gèrent leur CB)
- [ ] Webhooks `customer.subscription.*` traités côté Skalcook
- [ ] Table `subscriptions` ou flag sur `clients` pour le statut
      (actif, en retard, annulé, en essai)
- [ ] Page `/admin/abonnement` qui affiche le statut + lien portail
- [ ] Désactivation auto des accès si subscription en retard > 14 j
      (avec emails de relance avant)

**Effort** : 3-5 jours
**Labels** : `priority/medium`, `area/billing`, `v3`

---

### #12 Cleanup lint pré-existant (~136 erreurs)

**Pourquoi** : héritage de l'époque POC. Surtout des
`react/no-unescaped-entities` et des `react-hooks/immutability`. Aucun
bug runtime mais ça pollue les revues et fait peur aux nouveaux devs.

**Acceptance criteria**
- [ ] `npm run lint` retourne 0 erreur
- [ ] Les apostrophes JSX échappées (`d'établissement` → `d&apos;établissement`)
- [ ] Les fonctions hoistées dans `useEffect` réorganisées (déclarer
      avant l'effect)
- [ ] CI bloque les nouvelles erreurs lint

**Effort** : ~1 jour
**Labels** : `priority/low`, `area/quality`, `v3`

---

### #13 Quotas configurables par client

**Pourquoi** : aujourd'hui le quota `5000 ingrédients` est hardcodé
dans `components/ImportView.jsx`. Pour une offre Premium / Pro on veut
pouvoir augmenter par tenant.

**Acceptance criteria**
- [ ] Colonne `clients.quotas_json` (ou table dédiée)
- [ ] Champs : `max_ingredients`, `max_fiches`, `max_factures_par_mois`,
      `max_users`
- [ ] Vérifications côté serveur avant insert
- [ ] UI pour modifier les quotas dans `/superadmin/etablissements/[id]`
- [ ] Affichage du quota et de la consommation dans `/mon-compte` →
      onglet Abonnement

**Effort** : ~1 jour
**Labels** : `priority/medium`, `area/billing`, `v3`

---

### #14 Pages d'erreur custom 404 / 500

**Pourquoi** : actuellement Next.js affiche les pages d'erreur par défaut.
Manque un peu de polish pour une app commerciale.

**Acceptance criteria**
- [ ] `app/not-found.js` avec design Skalcook + bouton retour
- [ ] `app/error.js` (boundary global) avec ChefLoader pendant retry +
      message friendly + capture Sentry
- [ ] `app/global-error.js` pour les erreurs critiques

**Effort** : ~2 h
**Labels** : `priority/low`, `area/ux`, `v3`

---

### #15 Internationalisation de l'app (FR + EN minimum)

**Pourquoi** : ta landing parle déjà 4 langues (FR/EN/ES/IT — voir
`app/LandingClient.jsx`) mais l'app est en français only. Pour l'export
ou pour des chaînes hôtelières internationales, c'est bloquant.

**Acceptance criteria**
- [ ] Lib i18n : `next-intl` (recommandé en App Router) ou `lingui`
- [ ] Toutes les chaînes UI extraites dans des fichiers `messages/fr.json`
      et `messages/en.json`
- [ ] Détection langue au premier chargement (header `Accept-Language`),
      override par préférence utilisateur stockée
- [ ] Sélecteur langue dans la navbar
- [ ] PR séparée pour chaque grosse section (fiches, inventaire, achats…)
      pour éviter un mega-PR

**Effort** : 5-10 jours (gros chantier)
**Labels** : `priority/low`, `area/i18n`, `v3`

---

## Récapitulatif d'effort estimé

| Priorité | Items | Effort total |
|---|---|---|
| 🔴 Critique | #1-#4 | ~3-4 jours |
| 🟠 Importante | #5-#8 | ~5-8 jours (dont juridique externe) |
| 🟡 Nice-to-have | #9-#15 | ~3-4 semaines |

**Pour passer de "V1 commerciale" à "production sereine"** : cocher les 4
items 🔴 = ~1 semaine de boulot. C'est vraiment ce qui fait la différence.

Le reste est de l'optimisation et de la conformité à long terme — à
attaquer au fil des contrats clients qui arrivent.
