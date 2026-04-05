import Anthropic from '@anthropic-ai/sdk'
import { apiHandler } from '../../../../lib/apiHandler'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const schema = z.object({
  fileBase64: z.string().min(1, 'fileBase64 requis'),
  mimeType: z.enum(
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    { error: 'Type MIME non supporté. Utilisez JPEG, PNG, WebP ou PDF.' }
  ),
  clientId: z.string().uuid(),
})

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

export const POST = apiHandler({
  schema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data }) => {
    const { fileBase64, mimeType } = data

    const contentBlock = mimeType === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: fileBase64 } }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: PROMPT_EXTRACTION },
          ],
        },
      ],
    })

    const rawText = (message.content[0] as { text: string }).text ?? ''

    let parsed: Record<string, unknown>
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse')
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      console.error('parse-facture JSON parse error, raw:', rawText.slice(0, 500))
      return Response.json(
        { error: 'Réponse IA non parseable.', raw: rawText.slice(0, 500) },
        { status: 500 }
      )
    }

    const lignes = ((parsed.lignes as Array<Record<string, unknown>>) || [])
      .filter((l) => l && l.designation)
      .map((l) => ({
        designation: String(l.designation ?? '').trim(),
        quantite: Number(l.quantite) || 1,
        unite: String(l.unite ?? '').trim() || null,
        prix_unitaire_ht: Number(l.prix_unitaire_ht) || 0,
      }))

    return Response.json({
      fournisseur: (parsed.fournisseur as string) ?? null,
      date_facture: (parsed.date_facture as string) ?? null,
      numero_facture: (parsed.numero_facture as string) ?? null,
      lignes,
    })
  },
})
