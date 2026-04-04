import { z } from 'zod'
import { supabaseServiceRole, requireAdminOrSuperadmin } from '../../../../lib/apiGuards'

const schema = z.object({
  client_id:          z.string().uuid(),
  siret:              z.string().trim().optional().or(z.literal('')),
  num_tva:            z.string().trim().optional().or(z.literal('')),
  adresse_siege:      z.string().trim().optional().or(z.literal('')),
  code_naf:           z.string().trim().optional().or(z.literal('')),
  email_contact:      z.string().trim().email().optional().or(z.literal('')),
  telephone_contact:  z.string().trim().optional().or(z.literal('')),
})

function normalizeOptional(value) {
  const v = String(value || '').trim()
  return v.length > 0 ? v : null
}

function validateBusinessFields({ siret, num_tva }) {
  const cleanSiret = String(siret || '').replace(/\s+/g, '')
  const cleanTva   = String(num_tva || '').replace(/\s+/g, '').toUpperCase()
  if (cleanSiret && !/^\d{14}$/.test(cleanSiret)) {
    return 'Le SIRET doit contenir exactement 14 chiffres.'
  }
  if (cleanTva && !/^[A-Z]{2}[A-Z0-9]{2,20}$/.test(cleanTva)) {
    return 'Le numéro de TVA intracommunautaire est invalide (ex : FR12345678901).'
  }
  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Données invalides.', details: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const gate = await requireAdminOrSuperadmin(request, payload.client_id)
    if (gate.response) return gate.response

    const businessError = validateBusinessFields(payload)
    if (businessError) return Response.json({ error: businessError }, { status: 400 })

    const cleanSiret = normalizeOptional(payload.siret)?.replace(/\s+/g, '') || null
    const cleanTva   = normalizeOptional(payload.num_tva)?.replace(/\s+/g, '').toUpperCase() || null

    const { data, error } = await supabaseServiceRole
      .from('clients')
      .update({
        siret:             cleanSiret,
        num_tva:           cleanTva,
        adresse_siege:     normalizeOptional(payload.adresse_siege),
        code_naf:          normalizeOptional(payload.code_naf),
        email_contact:     normalizeOptional(payload.email_contact),
        telephone_contact: normalizeOptional(payload.telephone_contact),
      })
      .eq('id', payload.client_id)
      .select('id, siret, num_tva, adresse_siege, code_naf, email_contact, telephone_contact')
      .maybeSingle()

    if (error) return Response.json({ error: error.message || 'Erreur mise à jour.' }, { status: 400 })

    return Response.json({ success: true, client: data })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
