# Fiche de Tests V2 — Skalcook

> **Objectif** : Valider toutes les fonctionnalités refactorées avant de passer à la V3.
> **Branche** : `claude/refactor-poc-production-YZGAw`
> **Pré-requis** : `npm install && npm run dev`

---

## 1. Tests automatisés

### 1.1 Tests unitaires (52 tests)
```bash
npm test
```
- [ ] 52 tests passent (validators, food cost, conversions, normalisation)

### 1.2 Tests E2E (smoke tests)
```bash
npx playwright install   # première fois uniquement
npm run test:e2e
```
- [ ] Landing page charge
- [ ] Page login charge
- [ ] API docs retourne du JSON
- [ ] Headers rate-limiting présents
- [ ] Headers sécurité présents (HSTS, X-Content-Type-Options, etc.)
- [ ] Appel API non authentifié retourne 401

---

## 2. Authentification & Rôles

### 2.1 Login
- [ ] Connexion email/mot de passe fonctionne
- [ ] Redirection vers dashboard après login
- [ ] Déconnexion fonctionne
- [ ] Session expirée → redirection login

### 2.2 Rôles
- [ ] **Admin** : accès à tout (fiches, inventaire, achats, paramètres)
- [ ] **Cuisine** : accès fiches cuisine, pas bar
- [ ] **Bar** : accès fiches bar, pas cuisine
- [ ] **Directeur** : accès lecture seule (pas de modification)
- [ ] **Superadmin** : accès à /superadmin, peut switcher entre établissements

### 2.3 Multi-tenant
- [ ] Données isolées entre établissements
- [ ] Changement d'établissement fonctionne (superadmin)
- [ ] Cookie tenant_slug correctement set

---

## 3. Fiches techniques — Cuisine

### 3.1 Liste (/fiches)
- [ ] Affichage grille des fiches
- [ ] Recherche par nom
- [ ] Filtre par lieu
- [ ] Filtre par catégorie
- [ ] Filtre par saison
- [ ] Pagination fonctionne (> 24 fiches)
- [ ] Mode archivage : sélection + archivage en lot
- [ ] Vue archives : voir/désarchiver les fiches

### 3.2 Création (/fiches/nouvelle)
- [ ] Formulaire complet (nom, catégorie, lieu, saison, portions, prix)
- [ ] Ajout d'ingrédients avec recherche
- [ ] Calcul food cost en temps réel
- [ ] **TVA paramétrable** (pas 1.10 hardcodé — vérifier dans les paramètres)
- [ ] Prix indicatif calculé correctement
- [ ] Allergènes sélectionnables (14 allergènes EU)
- [ ] Sauvegarde auto (brouillon)
- [ ] Restauration du brouillon
- [ ] Soumission → redirection vers la fiche créée

### 3.3 Détail (/fiches/[id])
- [ ] Affichage nom, catégorie, lieu, saison, portions
- [ ] Photo affichée (si uploadée)
- [ ] Liste ingrédients avec coûts
- [ ] Récap financier : coût total, coût/portion, prix HT, food cost
- [ ] **Prix HT = Prix TTC / TVA paramétrable** (pas /1.10)
- [ ] Allergènes affichés (directs + cascade sous-fiches)
- [ ] Instructions de préparation
- [ ] Impression : mise en page propre, toutes infos présentes
- [ ] Bouton modifier → va sur /fiches/[id]/modifier
- [ ] Bouton supprimer → confirmation + suppression

### 3.4 Modification (/fiches/[id]/modifier)
- [ ] Préremplissage de tous les champs
- [ ] Modification ingrédients
- [ ] Recalcul food cost en temps réel
- [ ] **TVA paramétrable** dans le calcul
- [ ] Sauvegarde auto
- [ ] Soumission → mise à jour correcte

---

## 4. Fiches techniques — Bar

### 4.1 Liste (/bar/fiches)
- [ ] Mêmes fonctionnalités que cuisine (recherche, filtres, archivage)
- [ ] Couleurs bar (violet) distinctes de cuisine

### 4.2 Création (/bar/fiches/nouvelle)
- [ ] Sous-fiches dans la recherche d'ingrédients
- [ ] **TVA alcool** : 20% pour cocktails/vins/spiritueux, 10% sinon
- [ ] Seuils food cost bar : 22% (vert) / 28% (orange)
- [ ] Unité par défaut : cl (pas kg)

### 4.3 Détail + Modification (/bar/fiches/[id])
- [ ] Même vérification que cuisine mais avec TVA bar
- [ ] Badge sous-fiche (SF) visible
- [ ] Cascade allergènes depuis sous-fiches

---

## 5. Récap Food Cost

### 5.1 Cuisine (/recap)
- [ ] Vue par lieu : accordéons avec stats
- [ ] Vue par catégorie : regroupement par type de plat
- [ ] Vue global : KPIs + tableau récap
- [ ] Filtres saison/lieu/catégorie
- [ ] Archivage en lot depuis le récap
- [ ] **Export Excel** : colonnes Prix HT, TVA (%), Food cost (%)
- [ ] Seuils food cost cuisine (28%/35%) appliqués

### 5.2 Bar (/bar/recap)
- [ ] Mêmes fonctionnalités que cuisine
- [ ] TVA alcool correcte dans les calculs
- [ ] Seuils food cost bar (22%/28%)

---

## 6. Achats & Factures

### 6.1 Import facture (/controle-gestion/achats/import)
- [ ] Upload image/PDF
- [ ] OCR extraction via Claude Vision
- [ ] Réconciliation automatique des lignes
- [ ] Création d'ingrédient inline
- [ ] Liaison manuelle à un ingrédient existant
- [ ] Détection doublon (même numéro de facture)
- [ ] Sauvegarde avec mise à jour des prix
- [ ] Fichier attaché visible dans le détail

### 6.2 Liste factures (/controle-gestion/achats)
- [ ] Liste avec filtres fournisseur/date
- [ ] Détail d'une facture avec lignes
- [ ] **Suppression = soft-delete** (la facture reste en base)
- [ ] Factures supprimées ne s'affichent plus dans les listes

### 6.3 Mercuriale (/controle-gestion/mercuriale)
- [ ] Tableau prix par fournisseur
- [ ] Meilleur prix identifié
- [ ] Historique des prix

### 6.4 Affichage fichier facture
- [ ] PDF s'affiche dans un iframe (CSP frame-ancestors 'self')
- [ ] Images s'affichent correctement
- [ ] Pas d'erreur CSP dans la console

---

## 7. Inventaire

### 7.1 Création inventaire (/inventaire/nouveau)
- [ ] Inventaire tournant (Pareto 80/20)
- [ ] Inventaire complet (tous les ingrédients)
- [ ] Section cuisine / bar / global
- [ ] Pré-remplissage stock théorique

### 7.2 Saisie (/inventaire/[id]/saisie)
- [ ] Saisie quantités réelles
- [ ] Écart calculé automatiquement
- [ ] Sauvegarde ligne par ligne
- [ ] Ajout d'ingrédient manquant

### 7.3 Validation
- [ ] Validation d'inventaire → statut "validé"
- [ ] Inventaire validé non modifiable
- [ ] Suppression d'un brouillon possible

---

## 8. Import ingrédients

### 8.1 Cuisine (/import)
- [ ] Upload Excel
- [ ] Prévisualisation des ingrédients
- [ ] Détection nouveaux vs existants
- [ ] Import en lot

### 8.2 Bar (/bar/import)
- [ ] Mêmes fonctionnalités que cuisine
- [ ] Table ingredients_bar utilisée

---

## 9. Archives

### 9.1 Cuisine (/archives)
- [ ] Onglets fiches / menus
- [ ] Restauration d'une fiche archivée
- [ ] Suppression définitive avec confirmation

### 9.2 Bar (/bar/archives)
- [ ] Liste fiches bar archivées
- [ ] Restauration / suppression

---

## 10. Administration

### 10.1 Superadmin (/superadmin)
- [ ] Liste des établissements
- [ ] Création nouvel établissement
- [ ] Modification (nom, slug, couleurs, modules, seuils)
- [ ] Activation/désactivation
- [ ] Upload logo
- [ ] Invitation admin par email
- [ ] Onglet Activité : KPIs, graphique 7j, journal d'audit

### 10.2 Gestion utilisateurs (/superadmin/utilisateurs)
- [ ] Liste tous les utilisateurs
- [ ] Création utilisateur global
- [ ] Modification rôle/accès
- [ ] Suppression (empêche l'auto-suppression)

### 10.3 Paramètres (/parametres)
- [ ] Seuils food cost modifiables
- [ ] Lieux de service gérables
- [ ] Catégories de plats gérables

---

## 11. Sécurité

### 11.1 CSP & Headers
- [ ] Pas d'erreur CSP dans la console (pages normales)
- [ ] Lottie animations chargent correctement
- [ ] Factures PDF/images affichées sans erreur CSP
- [ ] `X-Frame-Options: SAMEORIGIN` présent
- [ ] `Strict-Transport-Security` présent
- [ ] `X-Content-Type-Options: nosniff` présent

### 11.2 Rate Limiting
- [ ] Header `X-RateLimit-Remaining` présent sur les réponses API
- [ ] Plus de 60 requêtes/minute → erreur 429

### 11.3 Validation des entrées
- [ ] UUID invalide dans l'URL → erreur 400 (pas crash)
- [ ] Body JSON invalide → erreur 400 avec détails
- [ ] Email invalide à la création user → erreur validation

---

## 12. Export & RGPD

### 12.1 Export données (/api/export-data)
- [ ] Télécharge un fichier JSON
- [ ] Contient : client, fiches, ingredients, factures, lignes achats, inventaires, ventes, menus, fournisseurs (12 tables)
- [ ] Données filtrées par client_id (pas de fuite inter-tenant)

### 12.2 Export Excel (RecapView)
- [ ] Colonnes : Nom, Lieu, Catégorie, Saison, Coût/portion, **Prix HT, TVA (%), Prix TTC**, Food cost
- [ ] Fichier nommé `recap_YYYY-MM-DD.xlsx` ou `recap_bar_YYYY-MM-DD.xlsx`

---

## 13. Calculs à vérifier manuellement

### 13.1 Food Cost
```
Formule : FC% = (Coût portion / Prix HT) × 100
Prix HT = Prix TTC / (1 + TVA%)
```
- [ ] Prendre une fiche cuisine avec prix TTC connu
- [ ] Vérifier : Prix HT = Prix TTC / 1.10 (TVA 10%)
- [ ] Vérifier : FC% = coût portion / prix HT × 100
- [ ] Changer la TVA dans les paramètres → le calcul change

### 13.2 TVA Alcool (Bar)
- [ ] Fiche "Cocktails" → TVA 20%
- [ ] Fiche "Soft" → TVA 10%
- [ ] Vérifier dans l'export Excel : colonne TVA correcte

### 13.3 Conversions d'unités
- [ ] 1000g = 1kg
- [ ] 100cl = 1L
- [ ] 1000ml = 1L
- [ ] Conversion dans l'inventaire : stock théorique correct

---

## 14. Migrations Supabase à appliquer

Avant de déployer, ces migrations doivent être exécutées sur la base Supabase :

```bash
# 1. RLS sur toutes les tables
supabase/migrations/20260405000000_enable_rls_all_tables.sql

# 2. Soft-delete factures + traçabilité HACCP
supabase/migrations/20260406000000_soft_delete_factures_tracabilite.sql
```

- [ ] Migration RLS appliquée
- [ ] Migration soft-delete appliquée
- [ ] Variable SUPERADMIN_EMAILS configurée dans Vercel

---

## 15. Variables d'environnement requises

```env
# Obligatoire (V2 — plus d'emails hardcodés)
SUPERADMIN_EMAILS=antony.despaux@hotmail.fr,antony@skalcook.com

# Optionnel (production — rate limiting Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

- [ ] SUPERADMIN_EMAILS configuré dans Vercel
- [ ] UPSTASH configuré (ou fallback in-memory accepté pour le moment)

---

## Checklist finale avant merge sur main

- [ ] Tous les tests unitaires passent (`npm test`)
- [ ] Smoke tests E2E passent (`npm run test:e2e`)
- [ ] Test manuel complet (sections 2 à 13 ci-dessus)
- [ ] Migrations Supabase appliquées
- [ ] Variables d'environnement configurées
- [ ] Aucune erreur CSP dans la console
- [ ] Calculs TVA vérifiés manuellement
- [ ] Export RGPD contient toutes les données
- [ ] Soft-delete factures fonctionnel
