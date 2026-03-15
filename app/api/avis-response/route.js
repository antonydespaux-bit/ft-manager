import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { reviewText, stars, section } = await request.json()

    if (!reviewText || !stars) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const nomEtablissement = section === 'bar' ? 'notre bar' : 'notre restaurant'

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Tu es le propriétaire de "${nomEtablissement}" à Paris, un établissement haut de gamme.
Un client a écrit cet avis (${stars}/5 étoiles) : "${reviewText}"

Instructions :
- Détecte la langue de l'avis et réponds dans CETTE MÊME langue
- Ton chaleureux, professionnel et élégant
- 3 à 4 phrases maximum
- Ne commence pas par "Cher client" ou "Dear customer"
- Si l'avis est négatif, reconnais le problème et propose une solution concrète
- Si l'avis est positif, remercie sincèrement et invite à revenir
- Style 5 étoiles, hôtel de luxe`
      }]
    })

    return Response.json({ response: message.content[0].text })

  } catch (err) {
    console.error('Anthropic error:', err)
    return Response.json({ error: 'Erreur génération IA' }, { status: 500 })
  }
}
