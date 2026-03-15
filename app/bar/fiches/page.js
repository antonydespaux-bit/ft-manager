'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme, Logo } from '../../../lib/theme.jsx'
import { useIsMobile } from '../../../lib/useIsMobile'
import { useTheme } from '../../../lib/useTheme'
import { useRole } from '../../../lib/useRole'

const CATEGORIES_BAR = ['Cocktails', 'Vins', 'Bières', 'Softs', 'Champagnes', 'Spiritueux', 'Sans alcool', 'Mocktails']

export default function BarFichesPage() {
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('toutes')
  const [saison, setSaison] = useState('toutes')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()
  const { c } = useTheme()
  const { role, nom, loading: roleLoading } = useRole()

  useEffect(() => {
    checkUser()
    loadFiches()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadFiches = async () => {
    const { data } = await supabase
      .from('fiches_bar')
      .select('*')
      .eq('archive', false)
      .order('created_at', { ascending: false })
    setFiches(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const fichesFiltrees = fiches.filter(f => {
    const matchRecherche = f.nom.toLowerCase().includes(recherche.toLowerCase())
    const matchCategorie = categorie === 'toutes' || f.categorie === categorie
    const matchSaison = saison === 'toutes' || f.saison === saison
    return matchRecherche && matchCategorie && matchSaison
  })

  const peutModifier = role === 'admin' || role === 'bar'

  const navItems = [
    ...(peutModifier ? [{ label: '+ Nouvelle fiche', path: '/bar/fiches/nouvelle', accent: true }] : []),
    { label: 'Dashboard', path: '/bar/dashboard' },
    { label: 'Récap', path: '/bar/recap' },
    { label: 'Ingrédients', path: '/bar/ingredients' },
    { label: 'Import', path: '/bar/import' },
    { label: 'Archives', path: '/bar/archives' },
    ...(role === 'admin' ? [{ label: '🍽️ Cuisine', path: '/choix' }] : []),
    ...(role === 'directeur' ? [{ label: '🍽️ Cuisine', path: '/dashboard' }] : []),
    { label: 'Déconnexion', path: null, action: handleLogout },
  ]

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>

      <div style={{
        background: '#3C3489', borderBottom: '0.5px solid #7F77DD40',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo height={28} couleur="white" onClick={() => router.push('/bar/dashboard')} />
          <span style={{ background: '#7F77DD', color: 'white', borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' }}>BAR</span>
        </div>

        {isMobile ? (
          <button onClick={() => setMenuOuvert(!menuOuvert)} style={{
            background: 'transparent', border: '0.5px solid rgba(255,255,255,0.3)',
            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
            color: 'white', fontSize: '18px'
          }}>☰</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {navItems.map((item, i) => (
              <button key={i}
                onClick={() => item.action ? item.action() : router.push(item.path)}
                style={{
                  background: item.accent ? '#C4956A' : 'transparent',
                  color: item.accent ? '#3C3489' : 'rgba(255,255,255,0.7)',
                  border: item.accent ? 'none' : '0.5px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', padding: '8px 14px', fontSize: '13px',
                  fontWeight: item.accent ? '600' : '400', cursor: 'pointer'
                }}
              >{item.label}</button>
            ))}
          </div>
        )}
      </div>

      {isMobile && menuOuvert && (
        <div style={{
          background: '#3C3489', padding: '8px 16px 16px',
          borderBottom: '0.5px solid #7F77DD40',
          position: 'sticky', top: '56px', zIndex: 99
        }}>
          {navItems.map((item, i) => (
            <button key={i}
              onClick={() => { setMenuOuvert(false); item.action ? item.action() : router.push(item.path) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: item.accent ? '#C4956A' : 'transparent',
                color: item.accent ? '#3C3489' : 'rgba(255,255,255,0.85)',
                border: 'none', borderRadius: '8px',
                padding: '12px 16px', fontSize: '14px',
                fontWeight: item.accent ? '600' : '400',
                cursor: 'pointer', marginBottom: '4px'
              }}
            >{item.label}</button>
          ))}
        </div>
      )}

      <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '16px' : '24px'
        }}>
          {[
            { label: 'Fiches bar', value: fiches.length },
            { label: 'Cocktails', value: fiches.filter(f => f.categorie === 'Cocktails').length },
            { label: 'Sans alcool', value: fiches.filter(f => f.categorie === 'Sans alcool' || f.categorie === 'Mocktails').length },
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Rechercher une fiche bar..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ flex: '1', minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`, fontSize: '14px', background: c.blanc, outline: 'none', color: c.texte }}
          />
          <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{
            padding: '10px 14px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`,
            fontSize: '14px', background: c.blanc, outline: 'none', cursor: 'pointer', color: c.texte
          }}>
            <option value="toutes">Toutes les catégories</option>
            {CATEGORIES_BAR.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted }}>Chargement...</div>
        ) : fichesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: c.blanc, borderRadius: '12px', border: `0.5px solid ${c.bordure}` }}>
            <div style={{ fontSize: '14px', color: c.texteMuted, marginBottom: '16px' }}>
              {fiches.length === 0 ? 'Aucune fiche bar pour le moment' : 'Aucune fiche ne correspond à votre recherche'}
            </div>
            {fiches.length === 0 && peutModifier && (
              <button onClick={() => router.push('/bar/fiches/nouvelle')} style={{
                background: '#7F77DD', color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
                cursor: 'pointer', fontWeight: '600'
              }}>Créer la première fiche bar</button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '10px' : '14px'
          }}>
            {fichesFiltrees.map(fiche => {
              const fc = fiche.prix_ttc && fiche.cout_portion
                ? (fiche.cout_portion / (fiche.prix_ttc / 1.10) * 100).toFixed(1)
                : null
              return (
                <div key={fiche.id}
                  onClick={() => router.push(`/bar/fiches/${fiche.id}`)}
                  style={{
                    background: c.blanc, borderRadius: '12px',
                    border: `0.5px solid ${c.bordure}`, cursor: 'pointer',
                    overflow: 'hidden', display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#7F77DD'
                    e.currentTarget.style.boxShadow = '0 2px 12px #7F77DD20'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = c.bordure
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {fiche.photo_url && (
                    <img src={fiche.photo_url} alt={fiche.nom}
                      style={{ width: isMobile ? '100px' : '100%', height: isMobile ? '100px' : '160px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ padding: isMobile ? '12px' : '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '500', color: c.texte }}>{fiche.nom}</div>
                      {fiche.categorie && (
                        <span style={{ background: '#EEEDFE', color: '#3C3489', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: '500', flexShrink: 0, marginLeft: '6px' }}>
                          {fiche.categorie}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: c.texteMuted, flexWrap: 'wrap', alignItems: 'center' }}>
                      {fiche.saison && <span style={{ fontSize: '11px' }}>{fiche.saison}</span>}
                      {fiche.nb_portions && <span>{fiche.nb_portions} portions</span>}
                      {fiche.prix_ttc && <span style={{ fontWeight: '500', color: c.texte }}>{Number(fiche.prix_ttc).toFixed(2)} €</span>}
                      {fc && (
                        <span style={{
                          background: fc < 22 ? '#EAF3DE' : fc < 28 ? '#FAEEDA' : '#FCEBEB',
                          color: fc < 22 ? '#3B6D11' : fc < 28 ? '#854F0B' : '#A32D2D',
                          borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: '500'
                        }}>{fc}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
