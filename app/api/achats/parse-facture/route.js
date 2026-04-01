import Anthropic from '@anthropic-ai/sdk'
import { requireAdminOrSuperadmin } from '../../../../lib/apiGuards'

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
    // ── Validation du body ───────────────────────────────────────────────────
    const body = await request.json()
    const { fileBase64, mimeType, clientId } = body ?? {}

    if (!fileBase64 || !mimeType || !clientId) {
      return Response.json(
        { error: 'Paramètres manquants : fileBase64, mimeType et clientId sont requis.' },
        { status: 400 }
      )
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!supportedTypes.includes(mimeType)) {
      return Response.json(
        { error: `Type MIME non supporté : ${mimeType}. Utilisez JPEG, PNG, WebP ou PDF.` },
        { status: 400 }
      )
    }

    // ── Auth : utilisateur connecté OU superadmin ────────────────────────────
    const { user, response: authError } = await requireAdminOrSuperadmin(request, clientId)
    if (authError) return authError

    // ── Appel Claude Vision / Document ──────────────────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            mimeType === 'application/pdf'
              ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
              : { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBase64 } },
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
