'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { theme, Logo } from '../../../lib/theme.jsx'

const ALLERGENES = [
  { id: 'arachides', label: 'Arachides', emoji: '🥜' },
  { id: 'soja', label: 'Soja', emoji: '🫘' },
  { id: 'lait', label: 'Lait', emoji: '🥛' },
  { id: 'fruits_a_coque', label: 'Fruits à coque', emoji: '🌰' },
  { id: 'celeri', label: 'Céleri', emoji: '🥬' },
  { id: 'moutarde', label: 'Moutarde', emoji: '🌿' },
  { id: 'sesame', label: 'Graines de sésame', emoji: '🌾' },
  { id: 'sulfites', label: 'Anhydride sulfureux', emoji: '🍷' },
  { id: 'lupin', label: 'Lupin', emoji: '🌼' },
  { id: 'mollusques', label: 'Mollusques', emoji: '🦪' },
]

export default function FicheDetail() {
  const [fiche, setFiche] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const c = theme.couleurs

  useEffect(() => {
    checkUser()
    loadFiche()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadFiche = async () => {
    const { data: ficheData } = await supabase
      .from('fiches')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!ficheData) { router.push('/fiches'); return }
    setFiche(ficheData)

    const { data: ingsData } = await supabase
      .from('fiche_ingredients')
      .select(`
        quantite,
        unite,
        ingredients (id, nom, prix_kg, unite)
      `)
      .eq('fiche_id', params.id)

    setIngredients(ingsData || [])
    setLoading(false)
  }

  const calculerCout = () => {
    return ingredients.reduce((total, ing) => {
      if (ing.ingredients?.prix_kg && ing.quantite) {
        return total + (ing.ingredients.prix_kg * ing.quantite)
      }
      return total
    }, 0)
  }

  const foodCost = () => {
    const cout = calculerCout()
    if (!fiche?.prix_ttc || !cout || !fiche?.nb_portions) return null
    const coutParPortion = cout / fiche.nb_portions
    const prixHT = fiche.prix_ttc / 1.10
    return (coutParPortion / prixHT * 100).toFixed(1)
  }

  const prixIndicatif = () => {
    const cout = calculerCout()
    if (!cout || !fiche?.nb_portions) return null
    const coutPortion = cout / fiche.nb_portions
    return (coutPortion / 0.28 * 1.10).toFixed(2)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cette fiche ?')) return
    await supabase.from('fiches').delete().eq('id', params.id)
    router.push('/fiches')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.fond }}>
      <div style={{ fontSize: '14px', color: c.texteMuted }}>Chargement...</div>
    </div>
  )

  const cout = calculerCout()
  const fc = foodCost()
  const prixIndic = prixIndicatif()

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>

      {/* Barre du haut */}
      <div className="no-print" style={{
        background: c.principal, borderBottom: `0.5px solid ${c.accent}40`,
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo height={30} couleur="white" onClick={() => router.push('/fiches')} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>|</span>
          <button
            onClick={() => router.push('/fiches')}
            style={{
              background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '6px 12px',
              fontSize: '13px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)'
            }}
          >← Retour</button>
          <span style={{ fontSize: '15px', fontWeight: '500', color: 'white' }}>{fiche.nom}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{
              background: c.accent, color: c.principal, border: 'none',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer'
            }}
          >Imprimer</button>
          <button
            onClick={() => router.push(`/fiches/${params.id}/modifier`)}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.7)',
              border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', cursor: 'pointer'
            }}
          >Modifier</button>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent', color: '#F09595',
              border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', cursor: 'pointer'
            }}
          >Supprimer</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          border: `0.5px solid ${c.bordure}`, marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '8px', color: c.texte }}>{fiche.nom}</h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {fiche.categorie && (
                  <span style={{
                    background: c.accentClair, color: c.principal,
                    borderRadius: '20px', padding: '3px 12px',
                    fontSize: '12px', fontWeight: '500'
                  }}>{fiche.categorie}</span>
                )}
                {fiche.saison && (
                  <span style={{
                    background: c.fond, color: c.texteMuted,
                    borderRadius: '20px', padding: '3px 12px',
                    fontSize: '12px', border: `0.5px solid ${c.bordure}`
                  }}>{fiche.saison}</span>
                )}
              </div>
            </div>
            <div style={{
              background: c.principal, color: c.accent,
              borderRadius: '10px', padding: '10px 16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Portions</div>
              <div style={{ fontSize: '24px', fontWeight: '500' }}>{fiche.nb_portions || '—'}</div>
            </div>
          </div>

          {fiche.description && (
            <div style={{
              background: c.fond, borderRadius: '8px', padding: '12px 16px',
              fontSize: '13px', color: c.texteMuted, lineHeight: '1.6'
            }}>
              {fiche.description}
            </div>
          )}

          {/* Allergènes */}
          {fiche.allergenes && fiche.allergenes.length > 0 && (
            <div style={{
              background: '#FCEBEB', borderRadius: '8px', padding: '14px 16px',
              marginTop: '12px', border: '0.5px solid #F09595'
            }}>
              <div style={{ fontSize: '11px', color: '#A32D2D', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Allergènes présents
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {fiche.allergenes.map(id => {
                  const allergene = ALLERGENES.find(a => a.id === id)
                  if (!allergene) return null
                  return (
                    <span key={id} style={{
                      background: 'white', color: '#A32D2D',
                      border: '0.5px solid #F09595', borderRadius: '20px',
                      padding: '4px 12px', fontSize: '12px', fontWeight: '500',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {allergene.emoji} {allergene.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tableau des ingrédients */}
        <div style={{
          background: 'white', borderRadius: '12px',
          border: `0.5px solid ${c.bordure}`, marginBottom: '16px', overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `0.5px solid ${c.bordure}`,
            fontSize: '13px', fontWeight: '500', color: c.texteMuted,
            textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            Ingrédients
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: c.fond }}>
                {['Ingrédient', 'Quantité', 'Unité', 'Prix unit.', 'Coût'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right',
                    fontSize: '11px', color: c.texteMuted, fontWeight: '500',
                    textTransform: 'uppercase', borderBottom: `0.5px solid ${c.bordure}`
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing, i) => {
                const coutLigne = ing.ingredients?.prix_kg && ing.quantite
                  ? ing.ingredients.prix_kg * ing.quantite : null
                return (
                  <tr key={i} style={{ borderBottom: i < ingredients.length - 1 ? `0.5px solid ${c.bordure}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: c.texte }}>
                      {ing.ingredients?.nom || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: c.texte }}>
                      {ing.quantite}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: c.texteMuted }}>
                      {ing.unite}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: c.texteMuted }}>
                      {ing.ingredients?.prix_kg ? `${Number(ing.ingredients.prix_kg).toFixed(2)} €` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '500', color: c.texte }}>
                      {coutLigne ? `${coutLigne.toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Récapitulatif financier */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          border: `0.5px solid ${c.bordure}`,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px'
        }}>
          {[
            { label: 'Coût total', value: cout ? `${cout.toFixed(2)} €` : '—' },
            { label: 'Coût / portion', value: cout && fiche.nb_portions ? `${(cout / fiche.nb_portions).toFixed(2)} €` : '—' },
            { label: 'Prix TTC', value: fiche.prix_ttc ? `${Number(fiche.prix_ttc).toFixed(2)} €` : '—' },
            { label: 'Prix HT', value: fiche.prix_ttc ? `${(fiche.prix_ttc / 1.10).toFixed(2)} €` : '—' },
          ].map((stat, i) => (
            <div key={i} style={{ background: c.fond, borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: c.texteMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '500', marginTop: '4px', color: c.texte }}>
                {stat.value}
              </div>
            </div>
          ))}
          {!fiche.prix_ttc && prixIndic && (
            <div style={{ background: c.vertClair, borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: c.vert, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Prix indicatif TTC
              </div>
              <div style={{ fontSize: '20px', fontWeight: '500', marginTop: '4px', color: c.vert }}>
                {prixIndic} €
              </div>
              <div style={{ fontSize: '10px', color: c.vert, opacity: 0.8, marginTop: '2px' }}>
                Basé sur 28% food cost
              </div>
            </div>
          )}
          {fc && (
            <div style={{
              background: fc < 30 ? '#EAF3DE' : fc < 40 ? '#FAEEDA' : '#FCEBEB',
              borderRadius: '8px', padding: '14px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em', color: fc < 30 ? '#3B6D11' : fc < 40 ? '#854F0B' : '#A32D2D' }}>
                Food cost
              </div>
              <div style={{ fontSize: '20px', fontWeight: '500', marginTop: '4px', color: fc < 30 ? '#3B6D11' : fc < 40 ? '#854F0B' : '#A32D2D' }}>
                {fc} %
              </div>
            </div>
          )}
        </div>

        {/* Pied de page impression */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#bbb' }}>
          {theme.hotel.nom} — {fiche.nom} — {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}
