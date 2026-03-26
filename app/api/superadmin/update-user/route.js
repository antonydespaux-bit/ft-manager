import { createClient } from '@supabase/supabase-js'
import { isSuperadminEmail } from '../../../../lib/superadmin'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const updateUserSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().trim().email(),
  nom: z.string().trim().min(2),
  role: z.string().trim().min(1).optional(),
  telephone: z.string().trim().optional().or(z.literal('')),
  site_web: z.string().trim().url().optional().or(z.literal('')),
  siret_personnel: z.string().trim().optional().or(z.literal('')),
  adresse_pro: z.string().trim().optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  const siret = String(data.siret_personnel || '').replace(/\s+/g, '')
  if (siret && !/^\d{14}$/.test(siret)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le SIRET personnel doit contenir 14 chiffres.',
      path: ['siret_personnel']
    })
  }
})

async function requireSuperAdmin(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { response: Response.json({ error: 'Non authentifié.' }, { status: 401 }) }
  }

  const jwt = authHeader.slice(7).trim()
  if (!jwt) {
    return { response: Response.json({ error: 'Non authentifié.' }, { status: 401 }) }
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser(jwt)
  if (userErr || !user) {
    return { response: Response.json({ error: 'Session invalide.' }, { status: 401 }) }
  }

  const userEmail = (user.email || '').toLowerCase().trim()
  if (isSuperadminEmail(userEmail)) {
    return { user }
  }

  const { data: profil, error: profilErr } = await supabaseServiceRole
    .from('profils')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (profilErr || !profil?.is_superadmin) {
    return { response: Response.json({ error: 'Accès refusé : super admin requis.' }, { status: 403 }) }
  }

  return { user }
}

export async function POST(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const parsed = updateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        { error: 'Payload invalide.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      user_id: userId,
      email,
      nom,
      role,
      telephone = '',
      site_web = '',
      siret_personnel = '',
      adresse_pro = ''
    } = parsed.data

    const { error: errAuth } = await supabaseServiceRole.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { nom }
    })
    if (errAuth) {
      return Response.json(
        { error: errAuth.message || 'Erreur mise à jour compte Auth.' },
        { status: 400 }
      )
    }

    const { error: errProfil } = await supabaseServiceRole
      .from('profils')
      .update({
        email,
        nom,
        ...(role ? { role } : {}),
        telephone: telephone || null,
        site_web: site_web || null,
        siret_personnel: (siret_personnel || '').replace(/\s+/g, '') || null,
        adresse_pro: adresse_pro || null
      })
      .eq('id', userId)

    if (errProfil) {
      return Response.json(
        { error: errProfil.message || 'Erreur mise à jour profil.' },
        { status: 400 }
      )
    }

    return Response.json({
      success: true,
      user: {
        id: userId,
        email,
        nom,
        role: role || null,
        telephone: telephone || null,
        site_web: site_web || null,
        siret_personnel: (siret_personnel || '').replace(/\s+/g, '') || null,
        adresse_pro: adresse_pro || null
      }
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
