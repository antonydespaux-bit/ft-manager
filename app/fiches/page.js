'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme, Logo } from '../../lib/theme.jsx'
import { useIsMobile } from '../../lib/useIsMobile'
import { useTheme } from '../../lib/useTheme'
import NavbarCuisine from '../../components/NavbarCuisine'

export default function FichesPage() {
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('toutes')
  const [saison, setSaison] = useState('toutes')
  const router = useRouter()
  const isMobile = useIsMobile()
  const { c } = useTheme()

  useEffect(() => {
    checkUser()
    loadFiches()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadFiches = async () => {
    const { data, error } = await supabase
      .from('fiches')
      .select('*')
      .neq('categorie', 'Sous-fiche')
      .eq('archive', false)
      .order('created_at', { ascending: false })
    if (!error) setFiches(data || [])
    setLoading(false)
  }


  const fichesFiltrees = fiches.filter(f => {
    const matchRecherche = f.nom.toLowerCase().includes(recherche.toLowerCase())
    const matchCategorie = categorie === 'toutes' || f.categorie === categorie
    const matchSaison = saison === 'toutes' || f.saison === saison
    return matchRecherche && matchCategorie && matchSaison
  })

  const categories = ['toutes', ...new Set(fiches.map(f => f.categorie).filter(Boolean))]


  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>

      <NavbarCuisine />

      <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '16px' : '24px'
        }}>
          {[
            { label: 'Fiches', value: fiches.length },
            { label: 'Plats', value: fiches.filter(f => f.categorie === 'Plats').length },
            { label: 'Desserts', value: fiches.filter(f => f.categorie === 'Desserts').length },
          ].map((stat, i) => (
            <div key={i} style={{
              background: c.blanc, borderRadius: '10px',
              padding: isMobile ? '12px' : '16px', border: `0.5px solid ${c.bordure}`
            }}>
              <div style={{ fontSize: '10px', color: c.texteMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '500', marginTop: '4px', color: c.texte }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', gap: '8px', marginBottom: '16px',
          flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap'
        }}>
          <input type="text" placeholder="Rechercher une fiche..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{
              flex: '1', minWidth: '200px', padding: '10px 14px',
              borderRadius: '8px', border: `0.5px solid ${c.bordure}`,
              fontSize: '14px', background: c.blanc, outline: 'none', color: c.texte
            }}
          />
          <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{
            padding: '10px 14px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`,
            fontSize: '14px', background: c.blanc, outline: 'none', cursor: 'pointer', color: c.texte
          }}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'toutes' ? 'Toutes les catégories' : cat}</option>
            ))}
          </select>
          <select value={saison} onChange={e => setSaison(e.target.value)} style={{
            padding: '10px 14px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`,
            fontSize: '14px', background: c.blanc, outline: 'none', cursor: 'pointer', color: c.texte
          }}>
            <option value="toutes">Toutes les saisons</option>
            {theme.saisons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted, fontSize: '14px' }}>
            Chargement...
          </div>
        ) : fichesFiltrees.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', background: c.blanc,
            borderRadius: '12px', border: `0.5px solid ${c.bordure}`
          }}>
            <div style={{ fontSize: '14px', color: c.texteMuted, marginBottom: '16px' }}>
              {fiches.length === 0 ? 'Aucune fiche pour le moment' : 'Aucune fiche ne correspond à votre recherche'}
            </div>
            {fiches.length === 0 && (
              <button onClick={() => router.push('/fiches/nouvelle')} style={{
                background: c.accent, color: c.principal, border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
                cursor: 'pointer', fontWeight: '600'
              }}>Créer la première fiche</button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '10px' : '14px'
          }}>
            {fichesFiltrees.map(fiche => (
              <div key={fiche.id} onClick={() => router.push(`/fiches/${fiche.id}`)}
                style={{
                  background: c.blanc, borderRadius: '12px',
                  border: `0.5px solid ${c.bordure}`, cursor: 'pointer',
                  overflow: 'hidden', display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = c.accent
                  e.currentTarget.style.boxShadow = `0 2px 12px ${c.accent}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = c.bordure
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {fiche.photo_url && (
                  <img src={fiche.photo_url} alt={fiche.nom}
                    style={{
                      width: isMobile ? '100px' : '100%',
                      height: isMobile ? '100px' : '160px',
                      objectFit: 'cover', flexShrink: 0
                    }}
                  />
                )}
                <div style={{ padding: isMobile ? '12px' : '16px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '500', color: c.texte }}>
                      {fiche.nom}
                    </div>
                    {fiche.categorie && (
                      <span style={{
                        background: c.accentClair, color: c.principal,
                        borderRadius: '20px', padding: '2px 8px',
                        fontSize: '10px', fontWeight: '500',
                        flexShrink: 0, marginLeft: '6px'
                      }}>{fiche.categorie}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: c.texteMuted, flexWrap: 'wrap' }}>
                    {fiche.saison && <span style={{ fontSize: '11px' }}>{fiche.saison}</span>}
                    {fiche.nb_portions && <span>{fiche.nb_portions} portions</span>}
                    {fiche.prix_ttc && (
                      <span style={{ fontWeight: '500', color: c.texte }}>
                        {Number(fiche.prix_ttc).toFixed(2)} €
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
