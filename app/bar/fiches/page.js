'use client'
import { useState, useEffect } from 'react'
import { supabase, getClientId } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme } from '../../../lib/theme.jsx'
import { useIsMobile } from '../../../lib/useIsMobile'
import { useTheme } from '../../../lib/useTheme'
import { useRole } from '../../../lib/useRole'
import { log } from '../../../lib/useLog'
import NavbarBar from '../../../components/NavbarBar'

const CATEGORIES_BAR = ['Cocktails', 'Vins', 'Bières', 'Softs', 'Champagnes', 'Spiritueux', 'Sans alcool', 'Mocktails', 'Sous-fiche']
const CATEGORIES_ALCOOL = ['Cocktails', 'Vins', 'Champagnes', 'Bières', 'Spiritueux']

export default function BarFichesPage() {
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('toutes')
  const [saison, setSaison] = useState('toutes')
  const [modeArchive, setModeArchive] = useState(false)
  const [selection, setSelection] = useState([])
  const [saving, setSaving] = useState(false)
  const [showArchives, setShowArchives] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()
  const { c } = useTheme()
  const { role } = useRole()

  const peutModifier = role === 'admin' || role === 'bar'

  useEffect(() => { checkUser() }, [])
  useEffect(() => { loadFiches() }, [showArchives])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/')
    } catch (err) { router.push('/') }
  }

  const loadFiches = async () => {
    try {
      setLoading(true)
      const clientId = await getClientId()
      if (!clientId) { router.push('/'); return }

      const { data, error } = await supabase
        .from('fiches_bar')
        .select('*')
        .eq('client_id', clientId)
        .eq('archive', showArchives)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiches(data || [])
      setSelection([])
    } catch (err) {
      console.error('Load fiches bar error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id) => {
    setSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toutSelectionner = () => {
    setSelection(selection.length === fichesFiltrees.length ? [] : fichesFiltrees.map(f => f.id))
  }

  const archiverSelection = async () => {
    if (selection.length === 0) return
    if (!confirm(`${showArchives ? 'Désarchiver' : 'Archiver'} ${selection.length} fiche${selection.length > 1 ? 's' : ''} ?`)) return
    setSaving(true)
    try {
      const clientId = await getClientId()
      if (!clientId) return
      const { error } = await supabase
        .from('fiches_bar')
        .update({ archive: !showArchives })
        .in('id', selection)
        .eq('client_id', clientId)
      if (error) throw error
      await log({
        action: showArchives ? 'DESARCHIVAGE' : 'ARCHIVAGE',
        entite: 'fiche_bar', entite_id: selection[0],
        entite_nom: `${selection.length} fiche(s) bar`, section: 'bar',
        details: `IDs: ${selection.join(', ')}`
      })
      setModeArchive(false)
      setSelection([])
      await loadFiches()
    } catch (err) {
      console.error('Archive error:', err)
      alert('Erreur lors de l\'archivage')
    } finally {
      setSaving(false)
    }
  }

  const fichesFiltrees = fiches.filter(f => {
    const matchRecherche = f.nom.toLowerCase().includes(recherche.toLowerCase())
    const matchCategorie = categorie === 'toutes' || f.categorie === categorie
    const matchSaison = saison === 'toutes' || f.saison === saison
    return matchRecherche && matchCategorie && matchSaison
  })

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>
      <NavbarBar />

      <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Fiches bar', value: fiches.length },
            { label: 'Cocktails', value: fiches.filter(f => f.categorie === 'Cocktails').length },
            { label: 'Préparations', value: fiches.filter(f => f.categorie === 'Sous-fiche').length },
          ].map((stat, i) => (
            <div key={i} style={{ background: c.blanc, borderRadius: '10px', padding: '16px', border: `0.5px solid ${c.bordure}` }}>
              <div style={{ fontSize: '10px', color: c.texteMuted, textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '500', color: c.texte }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filtres + actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Rechercher..." value={recherche} onChange={e => setRecherche(e.target.value)}
            style={{ flex: '1', minWidth: '200px', padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`, background: c.blanc, outline: 'none', fontSize: '14px', color: c.texte }} />
          <select value={categorie} onChange={e => setCategorie(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`, background: c.blanc, outline: 'none', cursor: 'pointer', color: c.texte, fontSize: '14px' }}>
            <option value="toutes">Toutes catégories</option>
            {CATEGORIES_BAR.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={saison} onChange={e => setSaison(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`, background: c.blanc, outline: 'none', cursor: 'pointer', color: c.texte, fontSize: '14px' }}>
            <option value="toutes">Toutes saisons</option>
            {theme.saisons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button onClick={() => { setShowArchives(!showArchives); setModeArchive(false); setSelection([]) }}
            style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              border: `0.5px solid ${showArchives ? '#7C3AED' : c.bordure}`,
              background: showArchives ? '#EDE9FE' : c.blanc,
              color: showArchives ? '#7C3AED' : c.texteMuted,
              fontWeight: showArchives ? '500' : '400', whiteSpace: 'nowrap'
            }}>
            📦 {showArchives ? 'Voir actives' : 'Voir archives'}
          </button>

          {peutModifier && fiches.length > 0 && (
            <button onClick={() => { setModeArchive(!modeArchive); setSelection([]) }}
              style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                border: `0.5px solid ${modeArchive ? '#DC2626' : c.bordure}`,
                background: modeArchive ? '#FEE2E2' : c.blanc,
                color: modeArchive ? '#DC2626' : c.texteMuted,
                fontWeight: modeArchive ? '500' : '400', whiteSpace: 'nowrap'
              }}>
              {modeArchive ? '✕ Annuler' : showArchives ? '📤 Désarchiver' : '📥 Archiver'}
            </button>
          )}
        </div>

        {/* Barre sélection mode archivage */}
        {modeArchive && (
          <div style={{
            background: showArchives ? '#FEF3C7' : '#FEE2E2',
            border: `0.5px solid ${showArchives ? '#FDE68A' : '#FECACA'}`,
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox"
                checked={selection.length === fichesFiltrees.length && fichesFiltrees.length > 0}
                onChange={toutSelectionner}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7C3AED' }}
              />
              <span style={{ fontSize: '13px', color: showArchives ? '#92400E' : '#DC2626', fontWeight: '500' }}>
                {selection.length > 0
                  ? `${selection.length} fiche${selection.length > 1 ? 's' : ''} sélectionnée${selection.length > 1 ? 's' : ''}`
                  : 'Sélectionnez les fiches à ' + (showArchives ? 'désarchiver' : 'archiver')}
              </span>
            </div>
            {selection.length > 0 && (
              <button onClick={archiverSelection} disabled={saving} style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
                background: saving ? '#A5B4FC' : (showArchives ? '#D97706' : '#7C3AED'),
                color: 'white'
              }}>
                {saving ? 'En cours...' : showArchives ? `📤 Désarchiver (${selection.length})` : `📥 Archiver (${selection.length})`}
              </button>
            )}
          </div>
        )}

        {/* Bandeau archives */}
        {showArchives && (
          <div style={{
            background: '#EDE9FE', border: '0.5px solid #DDD6FE',
            borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            📦 Fiches archivées — {fiches.length} fiche{fiches.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Grille fiches */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted }}>Chargement...</div>
        ) : fichesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: c.blanc, borderRadius: '12px', border: `0.5px solid ${c.bordure}` }}>
            <div style={{ fontSize: '14px', color: c.texteMuted, marginBottom: '16px' }}>
              {fiches.length === 0
                ? showArchives ? 'Aucune fiche archivée' : 'Aucune fiche pour le moment'
                : 'Aucune fiche ne correspond à votre recherche'}
            </div>
            {fiches.length === 0 && !showArchives && peutModifier && (
              <button onClick={() => router.push('/bar/fiches/nouvelle')} style={{
                background: '#7C3AED', color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
              }}>Créer la première fiche</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {fichesFiltrees.map(fiche => {
              const tva = CATEGORIES_ALCOOL.includes(fiche.categorie) ? 1.20 : 1.10
              const fc = fiche.prix_ttc && fiche.cout_portion
                ? (fiche.cout_portion / (fiche.prix_ttc / tva) * 100).toFixed(1)
                : null
              const isSelected = selection.includes(fiche.id)

              return (
                <div key={fiche.id}
                  onClick={() => modeArchive ? toggleSelection(fiche.id) : router.push(`/bar/fiches/${fiche.id}`)}
                  style={{
                    background: isSelected ? (showArchives ? '#FEF3C7' : '#EDE9FE') : c.blanc,
                    borderRadius: '12px',
                    border: `0.5px solid ${isSelected ? (showArchives ? '#FDE68A' : '#DDD6FE') : c.bordure}`,
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected && !modeArchive) { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,58,237,0.15)' } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = c.bordure; e.currentTarget.style.boxShadow = 'none' } }}
                >
                  {modeArchive && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                      <input type="checkbox" checked={isSelected}
                        onChange={() => toggleSelection(fiche.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                      />
                    </div>
                  )}
                  {fiche.photo_url && (
                    <img src={fiche.photo_url} alt={fiche.nom}
                      style={{ width: '100%', height: '160px', objectFit: 'cover', opacity: modeArchive && !isSelected ? 0.6 : 1 }}
                    />
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '500', color: c.texte, paddingRight: modeArchive ? '24px' : '0' }}>{fiche.nom}</div>
                      <span style={{
                        background: fiche.categorie === 'Sous-fiche' ? '#EDE9FE' : c.fond,
                        color: fiche.categorie === 'Sous-fiche' ? '#7C3AED' : c.texteMuted,
                        borderRadius: '20px', padding: '2px 8px', fontSize: '10px', flexShrink: 0
                      }}>{fiche.categorie}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', alignItems: 'center' }}>
                      {fiche.prix_ttc && <span style={{ fontWeight: '600', color: c.texte }}>{Number(fiche.prix_ttc).toFixed(2)} €</span>}
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
