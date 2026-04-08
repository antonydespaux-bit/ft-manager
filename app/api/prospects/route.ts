/**
 * Public endpoint : formulaire de contact de la landing page.
 *
 * Insert un prospect dans la table `prospects` via service_role
 * (la table est gardée par RLS, superadmin only, donc on ne peut pas
 * insérer via le client anonyme directement).
 *
 * Guard: 'none' (public). La protection anti-spam repose sur :
 *  - le rate limiting global du middleware (60 req/min/IP)
 *  - la validation Zod stricte
 *  - un honeypot optionnel (champ `website` caché côté UI, rejeté ici)
 */

import { apiHandler } from '../../../lib/apiHandler'
import { z } from 'zod'

// Empty string -> null pour les champs optionnels.
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const prospectSchema = z.object({
  nom:                z.string().min(1, 'Nom requis').max(255),
  email:              z.string().email('Email invalide').max(255),
  telephone:          z.preprocess(blankToNull, z.string().max(50).nullable().optional()),
  nb_etablissements:  z.coerce.number().int().min(1).max(9999).default(1),
  nom_etablissement:  z.preprocess(blankToNull, z.string().max(255).nullable().optional()),
  message:            z.preprocess(blankToNull, z.string().max(5000).nullable().optional()),
  langue:             z.preprocess(blankToNull, z.string().max(8).nullable().optional()),
  // Honeypot : si rempli, c'est un bot.
  website:            z.string().optional(),
})

export const POST = apiHandler({
  schema: prospectSchema,
  guard: 'none',
  handler: async ({ data, db }) => {
    // Honeypot check : un humain n'aura jamais de valeur ici.
    if (data.website && data.website.length > 0) {
      // On fait semblant d'accepter pour ne rien apprendre au bot.
      return Response.json({ ok: true }, { status: 201 })
    }

    const { error } = await db.from('prospects').insert({
      nom: data.nom,
      email: data.email,
      telephone: data.telephone ?? null,
      nb_etablissements: data.nb_etablissements ?? 1,
      nom_etablissement: data.nom_etablissement ?? null,
      message: data.message ?? null,
      langue: data.langue ?? 'fr',
      statut: 'nouveau',
    })

    if (error) throw new Error(error.message)

    return Response.json({ ok: true }, { status: 201 })
  },
})
