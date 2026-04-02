// ─── Catégories ───────────────────────────────────────────────────────────────

/** Catégories qui activent la création d'un ingrédient miroir (sous-fiche). */
export const CATEGORIES_SOUS_FICHE = ['Sous-fiche', 'Sous-fiches', 'Accompagnements']

/** Noms de catégories considérés comme "sous-fiche" pour is_sub_fiche. */
export const NOMS_SOUS_FICHE = ['Sous-fiche', 'Sous-fiches']

// ─── Unités ───────────────────────────────────────────────────────────────────

/** Unités de production disponibles pour les sous-fiches. */
export const UNITES_PRODUCTION = ['portions', 'kg', 'g', 'L', 'cl', 'ml', 'u']

// ─── Seuils food cost (valeurs par défaut — surchargées par les paramètres établissement) ─

export const DEFAULT_SEUILS = {
  cuisine: { vert: 28, orange: 35 },
  bar:     { vert: 22, orange: 28 },
}

/** TVA restauration par défaut (%). */
export const DEFAULT_TVA = 10

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGE_SIZE = 24

// ─── Conversions d'unités ─────────────────────────────────────────────────────

/** Table de conversion vers l'unité de base pour chaque unité de mesure. */
export const CONVERSION_UNITES = {
  kg:       { baseUnit: 'kg',       factor: 1 },
  g:        { baseUnit: 'kg',       factor: 0.001 },
  L:        { baseUnit: 'L',        factor: 1 },
  cl:       { baseUnit: 'L',        factor: 0.01 },
  ml:       { baseUnit: 'L',        factor: 0.001 },
  portions: { baseUnit: 'portions', factor: 1 },
  u:        { baseUnit: 'u',        factor: 1 },
}
