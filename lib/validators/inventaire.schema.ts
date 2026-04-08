import { z } from 'zod'
import { uuidSchema, clientIdSchema } from './achats.schema'

// ── Create inventaire ──────────────────────────────────────────────────────
export const createInventaireSchema = z.object({
  client_id: clientIdSchema,
  type:      z.enum(['tournant', 'complet'], {
    error: 'type doit être tournant ou complet.',
  }),
  section:   z.enum(['cuisine', 'bar', 'global'], {
    error: 'section invalide.',
  }).default('cuisine'),
  categorie_ids: z.array(uuidSchema).max(2, 'Maximum 2 catégories.').optional(),
})

export type CreateInventaireInput = z.infer<typeof createInventaireSchema>

// ── Save ligne ─────────────────────────────────────────────────────────────
export const saveLigneSchema = z.object({
  ligneId:         uuidSchema,
  clientId:        clientIdSchema,
  quantite_reelle: z.coerce.number().min(0).nullable(),
})

// ── Valider inventaire ─────────────────────────────────────────────────────
export const validerInventaireSchema = z.object({
  inventaireId: uuidSchema,
  clientId:     clientIdSchema,
})

// ── Delete inventaire ──────────────────────────────────────────────────────
export const deleteInventaireSchema = z.object({
  inventaireId: uuidSchema,
  clientId:     clientIdSchema,
})

// ── Add ligne ──────────────────────────────────────────────────────────────
export const addLigneSchema = z.object({
  inventaireId:  uuidSchema,
  clientId:      clientIdSchema,
  ingredientId:  uuidSchema,
  section:       z.enum(['cuisine', 'bar']).default('cuisine'),
})

// ── Stock théorique query ──────────────────────────────────────────────────
export const stockTheoriqueQuerySchema = z.object({
  client_id: clientIdSchema,
  section:   z.enum(['cuisine', 'bar']).default('cuisine'),
})

// ── Pareto query ───────────────────────────────────────────────────────────
export const paretoQuerySchema = z.object({
  client_id: clientIdSchema,
  section:   z.enum(['cuisine', 'bar']).default('cuisine'),
})
