import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { supabaseServiceRole } from '../../../../lib/apiGuards'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT_EXTRACTION = `Tu analyses une photo ou scan d'une facture fournisseur de restauration.
Extrais les informations suivantes et retourne UNIQUEMENT du JSON valide, sans markdown, sans texte avant ou après.

Format attendu :
{
  "fournisseur": "Nom du fournisseur (string ou null)",
  "date_facture": "YYYY-MM-DD (string ou null)",
  "numero_facture": "Numéro ou référence de la facture (string ou null)",
  "lignes": [
    {
      "designation": "Nom du produit tel qu'il apparaît sur la facture",
      "quantite": 5.0,
      "unite": "kg",
      "prix_unitaire_ht": 2.50
    }
  ]
}

Règles :
- unite doit être l'unité standard la plus proche (kg, g, L, mL, pièce, carton, etc.)
- prix_unitaire_ht est le prix HT PAR UNITÉ (pas le total de la ligne)
- Si une valeur est absente ou illisible, utilise null
- Ne retourne QUE le JSON, rien d'autre`

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Non authentifié.' }, { status: 401 })
    }
    const jwt = authHeader.slice(7).trim()

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser(jwt)
    if (userErr || !user) {
      return Response.json({ error: 'Session invalide.' }, { status: 401 })
    }

    // ── Validation du body ───────────────────────────────────────────────────
    const body = await request.json()
    const { fileBase64, mimeType, clientId } = body ?? {}

    if (!fileBase64 || !mimeType || !clientId) {
      return Response.json(
        { error: 'Paramètres manquants : fileBase64, mimeType et clientId sont requis.' },
        { status: 400 }
      )
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!supportedTypes.includes(mimeType)) {
      return Response.json(
        { error: `Type MIME non supporté : ${mimeType}. Utilisez JPEG, PNG ou WebP.` },
        { status: 400 }
      )
    }

    // ── Vérification d'accès au client ───────────────────────────────────────
    const { data: access } = await supabaseServiceRole
      .from('acces_clients')
      .select('client_id')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (!access) {
      return Response.json({ error: 'Accès refusé à cet établissement.' }, { status: 403 })
    }

    // ── Appel Claude Vision ──────────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: fileBase64,
              },
            },
            {
              type: 'text',
              text: PROMPT_EXTRACTION,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0]?.text ?? ''

    // ── Parsing du JSON retourné ─────────────────────────────────────────────
    let parsed
    try {
      // Tenter d'extraire le JSON même si Claude a ajouté du texte malgré la consigne
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse')
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error('parse-facture JSON parse error:', parseErr, 'raw:', rawText.slice(0, 500))
      return Response.json(
        { error: 'Réponse IA non parseable.', raw: rawText.slice(0, 500) },
        { status: 500 }
      )
    }

    // Normalisation légère des lignes
    const lignes = (parsed.lignes || [])
      .filter(l => l && l.designation)
      .map(l => ({
        designation:      String(l.designation ?? '').trim(),
        quantite:         Number(l.quantite) || 1,
        unite:            String(l.unite ?? '').trim() || null,
        prix_unitaire_ht: Number(l.prix_unitaire_ht) || 0,
      }))

    return Response.json({
      fournisseur:    parsed.fournisseur    ?? null,
      date_facture:   parsed.date_facture   ?? null,
      numero_facture: parsed.numero_facture ?? null,
      lignes,
    })
  } catch (err) {
    console.error('parse-facture error:', err)
    return Response.json(
      { error: 'Erreur serveur lors de l\'extraction.', details: err.message },
      { status: 500 }
    )
  }
}
