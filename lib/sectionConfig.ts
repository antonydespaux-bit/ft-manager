/**
 * Section configuration system.
 *
 * Centralizes ALL differences between cuisine and bar into a single config object.
 * This eliminates the need for separate page files for each section.
 *
 * Usage:
 *   const config = getSectionConfig('bar')
 *   const { data } = await supabase.from(config.tables.fiches).select(...)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type Section = 'cuisine' | 'bar'

export interface SectionConfig {
  section: Section
  label: string
  labelPlural: string

  // Database tables
  tables: {
    fiches: string
    ingredients: string
    ficheIngredients: string
    ficheFK: string  // Foreign key name in fiche_ingredients
  }

  // Business rules
  defaultUnite: string
  tva: (categorie?: string) => number
  seuils: {
    vert: number
    orange: number
  }

  // UI
  colors: {
    accent: string
    accentBg: string
    accentText: string
  }

  // Categories requiring 20% TVA (bar only)
  categoriesAlcool: string[]
}

// ── Alcohol categories (bar section) ───────────────────────────────────────

const CATEGORIES_ALCOOL = [
  'Cocktails', 'Cocktails signatures', 'Cocktails classiques',
  'Spiritueux', 'Bières', 'Vins', 'Vins au verre',
  'Champagnes', 'Digestifs', 'Apéritifs',
]

// ── Config definitions ─────────────────────────────────────────────────────

const SECTION_CONFIGS: Record<Section, SectionConfig> = {
  cuisine: {
    section: 'cuisine',
    label: 'Cuisine',
    labelPlural: 'Fiches cuisine',

    tables: {
      fiches: 'fiches',
      ingredients: 'ingredients',
      ficheIngredients: 'fiche_ingredients',
      ficheFK: 'fiche_id',
    },

    defaultUnite: 'kg',
    tva: () => 1.10,
    seuils: { vert: 28, orange: 35 },

    colors: {
      accent: '#E63946',
      accentBg: '#FEF2F2',
      accentText: '#991B1B',
    },

    categoriesAlcool: [],
  },

  bar: {
    section: 'bar',
    label: 'Bar',
    labelPlural: 'Fiches bar',

    tables: {
      fiches: 'fiches_bar',
      ingredients: 'ingredients_bar',
      ficheIngredients: 'fiche_bar_ingredients',
      ficheFK: 'fiche_bar_id',
    },

    defaultUnite: 'cl',
    tva: (categorie?: string) => {
      if (categorie && CATEGORIES_ALCOOL.includes(categorie)) return 1.20
      return 1.10
    },
    seuils: { vert: 22, orange: 28 },

    colors: {
      accent: '#7C3AED',
      accentBg: '#F5F3FF',
      accentText: '#5B21B6',
    },

    categoriesAlcool: CATEGORIES_ALCOOL,
  },
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getSectionConfig(section: Section): SectionConfig {
  return SECTION_CONFIGS[section]
}

/**
 * Determines the section from the current URL pathname.
 * /bar/* → 'bar', everything else → 'cuisine'
 */
export function getSectionFromPath(pathname: string): Section {
  return pathname.startsWith('/bar') ? 'bar' : 'cuisine'
}

/**
 * Calculates food cost percentage.
 */
export function calculerFC(
  coutPortion: number,
  prixTTC: number,
  tvaFactor: number
): number | null {
  if (!coutPortion || !prixTTC) return null
  const prixHT = prixTTC / tvaFactor
  return (coutPortion / prixHT) * 100
}

/**
 * Returns food cost color based on section thresholds.
 */
export function getFCColor(
  fc: number,
  seuils: { vert: number; orange: number }
): { bg: string; color: string; level: 'vert' | 'orange' | 'rouge' } {
  if (fc < seuils.vert) return { bg: '#EAF3DE', color: '#3B6D11', level: 'vert' }
  if (fc < seuils.orange) return { bg: '#FAEEDA', color: '#854F0B', level: 'orange' }
  return { bg: '#FCEBEB', color: '#A32D2D', level: 'rouge' }
}

// Re-export for convenience
export { CATEGORIES_ALCOOL }
