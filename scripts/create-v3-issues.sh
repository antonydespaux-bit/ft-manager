#!/usr/bin/env bash
# Crée les 15 issues GitHub de la roadmap V3 d'un coup.
#
# Prérequis :
#   - gh CLI installé : https://cli.github.com/
#   - Authentifié : `gh auth login`
#   - Lancé depuis la racine du repo skalcook
#
# Usage :
#   bash scripts/create-v3-issues.sh             # crée toutes les issues
#   bash scripts/create-v3-issues.sh --dry-run   # affiche sans créer
#   bash scripts/create-v3-issues.sh --milestone "V3"  # ajoute à un milestone

set -euo pipefail

REPO="antonydespaux-bit/skalcook"
DRY_RUN=false
MILESTONE=""

# ── Args ────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --milestone) MILESTONE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# ── Sanity checks ───────────────────────────────────────────────────────────
if ! command -v gh &> /dev/null; then
  echo "❌ gh CLI introuvable. Installe-le : https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "❌ gh n'est pas authentifié. Lance : gh auth login" >&2
  exit 1
fi

# ── Crée les labels nécessaires (idempotent) ────────────────────────────────
create_label() {
  local name="$1" color="$2" description="$3"
  if $DRY_RUN; then
    echo "  [dry-run] label: $name"
  else
    gh label create "$name" --color "$color" --description "$description" \
      --repo "$REPO" --force >/dev/null 2>&1 || true
  fi
}

echo "▶ Création des labels..."
create_label "priority/critical" "B60205" "Critique fiabilité prod"
create_label "priority/high"     "D93F0B" "Important conformité commerciale"
create_label "priority/medium"   "FBCA04" "Améliorations qualité"
create_label "priority/low"      "0E8A16" "Nice-to-have"
create_label "area/observability" "1D76DB" "Logs, monitoring, métriques"
create_label "area/security"      "5319E7" "Sécurité, rate limiting, auth"
create_label "area/ops"           "0052CC" "Backups, runbooks, déploiement"
create_label "area/testing"       "0E8A16" "Tests unit / E2E / coverage"
create_label "area/legal"         "C5DEF5" "Juridique, contrats, RGPD"
create_label "area/rgpd"          "BFD4F2" "Conformité RGPD"
create_label "area/quality"       "FEF2C0" "Lint, refactor, dette technique"
create_label "area/billing"       "F9D0C4" "Facturation, abonnements, quotas"
create_label "area/ux"            "D4C5F9" "Polish UX et accessibilité"
create_label "area/i18n"          "BFDADC" "Internationalisation"
create_label "v3"                 "5319E7" "Backlog V3"
echo "✓ Labels créés/à jour"
echo

# ── Helper de création d'issue ──────────────────────────────────────────────
create_issue() {
  local title="$1" labels="$2" body="$3"
  echo "📝 $title"
  if $DRY_RUN; then
    return
  fi
  local args=(
    --repo "$REPO"
    --title "$title"
    --body "$body"
    --label "$labels"
  )
  if [[ -n "$MILESTONE" ]]; then
    args+=(--milestone "$MILESTONE")
  fi
  gh issue create "${args[@]}" >/dev/null
}

# ── 🔴 Critiques ────────────────────────────────────────────────────────────
echo "▶ 🔴 Issues critiques..."

create_issue \
  "Monitoring : intégrer Sentry (client + serveur)" \
  "priority/critical,area/observability,v3" \
  "**Pourquoi** : aucun outil pour détecter les erreurs en prod aujourd'hui. On ne saura qu'un client a un bug que s'il appelle.

**Acceptance criteria**
- [ ] Compte Sentry créé (free tier 5k events/mois)
- [ ] \`@sentry/nextjs\` installé et configuré (client, server, edge)
- [ ] DSN dans env vars Vercel
- [ ] Source maps uploadées au build
- [ ] Toutes les erreurs du \`apiHandler\` envoyées à Sentry
- [ ] Tag chaque event avec \`client_id\` pour filtrer par tenant
- [ ] Test de bout en bout

**Effort estimé** : ~2 h
**Réf** : docs/v3-roadmap.md item #1"

create_issue \
  "Drill de restore base de données + procédure documentée" \
  "priority/critical,area/ops,v3" \
  "**Pourquoi** : Supabase fait des backups quotidiens, mais on n'a jamais testé la restauration. Le jour où on en a besoin, on saura pas faire.

**Acceptance criteria**
- [ ] Branche Supabase de test créée
- [ ] Restauration d'un backup d'il y a 24 h
- [ ] Vérification intégrité (lignes, FK, RLS)
- [ ] \`docs/runbooks/restore-database.md\` rédigé : commandes, durée, vérifs post-restore
- [ ] Définir RPO et RTO

**Effort estimé** : ~3 h
**Réf** : docs/v3-roadmap.md item #2"

create_issue \
  "Brancher Upstash Redis pour le rate limiting multi-instance" \
  "priority/critical,area/security,v3" \
  "**Pourquoi** : \`middleware.ts\` utilise un rate-limit en mémoire. En multi-instance Vercel le quota est multiplié par N. Le code Upstash est déjà branché conditionnellement, il manque juste les env vars.

**Acceptance criteria**
- [ ] Compte Upstash + database Redis (région EU, free tier)
- [ ] \`UPSTASH_REDIS_REST_URL\` et \`UPSTASH_REDIS_REST_TOKEN\` dans env vars Vercel (Production + Preview)
- [ ] Test charge : 70 req/min depuis 2 IPs → blocage à la 60ᵉ par IP
- [ ] Vérifier que le free tier suffit (10k commandes/jour)

**Effort estimé** : ~30 min
**Réf** : docs/v3-roadmap.md item #3"

create_issue \
  "Tests E2E Playwright sur les parcours critiques" \
  "priority/critical,area/testing,v3" \
  "**Pourquoi** : \`playwright.config.ts\` existe mais aucun test écrit. Sans E2E, impossible de shipper en confiance chaque semaine.

**Acceptance criteria** (5-7 parcours)
- [ ] Login admin → dashboard
- [ ] Création fiche cuisine → calcul food cost
- [ ] Inventaire flash → saisie → validation
- [ ] Import facture (parse OCR) → mapping → save
- [ ] Export RGPD JSON
- [ ] Création user (\`/admin\`) → invitation
- [ ] Tous les tests dans la CI sur chaque PR
- [ ] Run total < 3 min en CI

**Effort estimé** : 1-2 jours
**Réf** : docs/v3-roadmap.md item #4"

# ── 🟠 Importantes ──────────────────────────────────────────────────────────
echo
echo "▶ 🟠 Issues importantes..."

create_issue \
  "Rédiger les CGV (Conditions Générales de Vente B2B SaaS)" \
  "priority/high,area/legal,v3" \
  "**Pourquoi** : pour vendre du SaaS B2B, les CGU ne suffisent pas. CGV requises avec : tarifs, paiement, durée, SLA, responsabilité, résiliation, propriété intellectuelle.

**Acceptance criteria**
- [ ] Modèle CGV SaaS B2B (avocat ou modèle spécialisé)
- [ ] Adapté à Skalcook (prix, modules, RGPD, durée)
- [ ] Page \`/cgv\` ajoutée
- [ ] Lien dans mentions légales et footer
- [ ] Acceptation explicite à la création de compte (checkbox + horodatage BDD, similaire à \`date_cgu\`)

**Effort estimé** : 2-5 jours (dépend de l'avocat)
**Réf** : docs/v3-roadmap.md item #5"

create_issue \
  "Signer un DPA (Data Processing Agreement) avec chaque client" \
  "priority/high,area/legal,v3" \
  "**Pourquoi** : obligation RGPD dès qu'un client confie des données personnelles. Contrat de sous-traitance qui décrit le rôle de processor.

**Acceptance criteria**
- [ ] Modèle DPA (avocat ou CNIL adapté)
- [ ] Annexe sous-traitants : Vercel, Supabase, Anthropic, Upstash, Sentry, Google Analytics
- [ ] Workflow signature électronique (DocuSign / Yousign)
- [ ] Stockage des DPA signés par client

**Effort estimé** : 1-2 jours setup + 30 min/client après
**Réf** : docs/v3-roadmap.md item #6"

create_issue \
  "Mettre à jour la politique de confidentialité avec les sous-traitants" \
  "priority/high,area/legal,area/rgpd,v3" \
  "**Pourquoi** : la politique doit lister exhaustivement les sous-traitants avec leur région et le motif du transfert.

**Acceptance criteria**
- [ ] Section 'Sous-traitants' dans \`app/politique-confidentialite/page.js\`
- [ ] Tableau : nom, fonction, pays d'hébergement, base légale du transfert
- [ ] Section 'Conservation des données' (factures 10 ans, comptes jusqu'à résiliation, logs 13 mois)
- [ ] Date de dernière mise à jour visible

**Effort estimé** : ~1 h
**Réf** : docs/v3-roadmap.md item #7"

create_issue \
  "Vérifier le statut juridique de l'éditeur (Skalcook SAS)" \
  "priority/high,area/legal,v3" \
  "**Pourquoi** : 'Skalcook SAS' apparaît dans les mentions légales. Si la SAS n'est pas immatriculée ou n'a pas d'assurance RC pro, vendre expose à un risque personnel direct.

**Acceptance criteria**
- [ ] SIRET vérifié et mentionné dans mentions légales
- [ ] Assurance RC professionnelle (couverture cyber + données)
- [ ] Compte bancaire pro
- [ ] Conditions TVA OK
- [ ] (Si SAS pas encore créée) statut auto-entrepreneur transitoire

**Effort estimé** : variable (administratif)
**Réf** : docs/v3-roadmap.md item #8"

# ── 🟡 Nice-to-have ─────────────────────────────────────────────────────────
echo
echo "▶ 🟡 Issues nice-to-have..."

create_issue \
  "Code coverage minimum + badge README" \
  "priority/medium,area/testing,v3" \
  "**Pourquoi** : il y a des tests mais aucun seuil. Difficile de dire 'on est bien testés' sans chiffre.

**Acceptance criteria**
- [ ] \`vitest --coverage\` configuré (provider v8, thresholds)
- [ ] CI bloque si coverage < 60% sur \`lib/services/**\` et \`lib/validators/**\`
- [ ] Badge coverage dans le README

**Effort estimé** : ~2 h
**Réf** : docs/v3-roadmap.md item #9"

create_issue \
  "Page Activité enrichie pour les admins clients" \
  "priority/medium,area/ux,v3" \
  "**Pourquoi** : \`/admin/logs\` existe mais minimal. Améliorer pour audit RGPD et debug client.

**Acceptance criteria**
- [ ] Filtres : utilisateur, type d'action, période, section
- [ ] Export CSV de la sélection
- [ ] Pagination serveur
- [ ] Affichage \`details\` JSON formaté dans une modale

**Effort estimé** : ~1 jour
**Réf** : docs/v3-roadmap.md item #10"

create_issue \
  "Brancher Stripe pour la facturation et les abonnements" \
  "priority/medium,area/billing,v3" \
  "**Pourquoi** : aucune gestion d'abonnement automatisée. Ingérable au-delà de 5 clients.

**Acceptance criteria**
- [ ] Stripe Customer Portal configuré
- [ ] Webhooks \`customer.subscription.*\` traités
- [ ] Statut subscription en BDD (actif, retard, annulé, essai)
- [ ] Page \`/admin/abonnement\` (statut + lien portail)
- [ ] Désactivation auto si retard > 14 j (avec emails de relance)

**Effort estimé** : 3-5 jours
**Réf** : docs/v3-roadmap.md item #11"

create_issue \
  "Cleanup lint pré-existant (~136 erreurs)" \
  "priority/low,area/quality,v3" \
  "**Pourquoi** : héritage POC. Surtout des \`react/no-unescaped-entities\` et \`react-hooks/immutability\`. Aucun bug runtime mais ça pollue les revues.

**Acceptance criteria**
- [ ] \`npm run lint\` retourne 0 erreur
- [ ] Apostrophes JSX échappées (\`d'établissement\` → \`d&apos;établissement\`)
- [ ] Fonctions hoistées dans \`useEffect\` réorganisées
- [ ] CI bloque les nouvelles erreurs lint

**Effort estimé** : ~1 jour
**Réf** : docs/v3-roadmap.md item #12"

create_issue \
  "Quotas configurables par client (offres Pro / Premium)" \
  "priority/medium,area/billing,v3" \
  "**Pourquoi** : le quota \`5000 ingrédients\` est hardcodé dans \`ImportView.jsx\`. Pour une offre Premium on veut pouvoir augmenter par tenant.

**Acceptance criteria**
- [ ] Colonne \`clients.quotas_json\` (ou table dédiée)
- [ ] Champs : \`max_ingredients\`, \`max_fiches\`, \`max_factures_par_mois\`, \`max_users\`
- [ ] Vérifications côté serveur avant insert
- [ ] UI dans \`/superadmin/etablissements/[id]\`
- [ ] Affichage quota + consommation dans \`/mon-compte\` → Abonnement

**Effort estimé** : ~1 jour
**Réf** : docs/v3-roadmap.md item #13"

create_issue \
  "Pages d'erreur custom 404 / 500 / global error boundary" \
  "priority/low,area/ux,v3" \
  "**Pourquoi** : Next.js affiche les pages d'erreur par défaut. Manque de polish pour une app commerciale.

**Acceptance criteria**
- [ ] \`app/not-found.js\` avec design Skalcook + bouton retour
- [ ] \`app/error.js\` (boundary global) + capture Sentry
- [ ] \`app/global-error.js\` pour les erreurs critiques

**Effort estimé** : ~2 h
**Réf** : docs/v3-roadmap.md item #14"

create_issue \
  "Internationalisation de l'app (FR + EN minimum)" \
  "priority/low,area/i18n,v3" \
  "**Pourquoi** : la landing parle 4 langues, mais l'app est en français only. Bloquant pour l'export et les chaînes hôtelières internationales.

**Acceptance criteria**
- [ ] Lib i18n : \`next-intl\` (recommandé en App Router)
- [ ] Toutes les chaînes UI extraites dans \`messages/fr.json\` et \`messages/en.json\`
- [ ] Détection langue (\`Accept-Language\`) + override par préférence
- [ ] Sélecteur langue dans la navbar
- [ ] PR séparée par grosse section pour éviter un mega-PR

**Effort estimé** : 5-10 jours (gros chantier)
**Réf** : docs/v3-roadmap.md item #15"

# ── Done ────────────────────────────────────────────────────────────────────
echo
if $DRY_RUN; then
  echo "✓ Dry-run terminé. Relance sans --dry-run pour créer les 15 issues."
else
  echo "✅ 15 issues créées sur $REPO"
  echo "   👉 https://github.com/$REPO/issues?q=is%3Aissue+is%3Aopen+label%3Av3"
fi
