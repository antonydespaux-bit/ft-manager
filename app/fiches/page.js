'use client'
import { useState, useEffect } from 'react'
import { supabase, getClientId } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme } from '../../lib/theme.jsx'
import { useIsMobile } from '../../lib/useIsMobile'
import { useTheme } from '../../lib/useTheme'
import { useRole } from '../../lib/useRole'
import { log } from '../../lib/useLog'
import NavbarCuisine from '../../components/NavbarCuisine'

export default function FichesPage() {
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

  const peutModifier = role === 'admin' || role === 'cuisine'

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    loadFiches()
  }, [showArchives])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/')
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/')
    }
  }

  const loadFiches = async () => {
    try {
      setLoading(true)
      const clientId = await getClientId()
      if (!clientId) { router.push('/'); return }

      const { data, error } = await supabase
        .from('fiches')
        .select('*')
        .eq('client_id', clientId)
        .neq('categorie', 'Sous-fiche')
        .eq('archive', showArchives)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiches(data || [])
      setSelection([])
    } catch (err) {
      console.error('Load fiches error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id) => {
    setSelection(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toutSelectionner = () => {
    if (selection.length === fichesFiltrees.length) {
      setSelection([])
    } else {
      setSelection(fichesFiltrees.map(f => f.id))
    }
  }

  const archiverSelection = async () => {
    if (selection.length === 0) return
    if (!confirm(`${showArchives ? 'Désarchiver' : 'Archiver'} ${selection.length} fiche${selection.length > 1 ? 's' : ''} ?`)) return

    setSaving(true)
    try {
      const clientId = await getClientId()
      if (!clientId) return

      const { error } = await supabase
        .from('fiches')
        .update({ archive: !showArchives })
        .in('id', selection)
        .eq('client_id', clientId)

      if (error) throw error

      await log({
        action: showArchives ? 'DESARCHIVAGE' : 'ARCHIVAGE',
        entite: 'fiche',
        entite_id: selection[0],
        entite_nom: `${selection.length} fiche(s)`,
        section: 'cuisine',
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

  const categories = ['toutes', ...new Set(fiches.map(f => f.categorie).filter(Boolean))]

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>
      <NavbarCuisine />

      <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* KPIs */}
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

        {/* Barre d'actions */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '16px',
          flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', alignItems: 'center'
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

          {/* Bouton archives */}
          <button
            onClick={() => { setShowArchives(!showArchives); setModeArchive(false); setSelection([]) }}
            style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              border: `0.5px solid ${showArchives ? c.accent : c.bordure}`,
              background: showArchives ? c.accentClair : c.blanc,
              color: showArchives ? c.accent : c.texteMuted,
              fontWeight: showArchives ? '500' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            📦 {showArchives ? 'Voir actives' : 'Voir archives'}
          </button>

          {/* Bouton mode archivage */}
          {peutModifier && fiches.length > 0 && (
            <button
              onClick={() => { setModeArchive(!modeArchive); setSelection([]) }}
              style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                border: `0.5px solid ${modeArchive ? '#DC2626' : c.bordure}`,
                background: modeArchive ? '#FEE2E2' : c.blanc,
                color: modeArchive ? '#DC2626' : c.texteMuted,
                fontWeight: modeArchive ? '500' : '400',
                whiteSpace: 'nowrap'
              }}
            >
              {modeArchive ? '✕ Annuler' : showArchives ? '📤 Désarchiver' : '📥 Archiver'}
            </button>
          )}
        </div>

        {/* Barre de sélection en mode archivage */}
        {modeArchive && (
          <div style={{
            background: showArchives ? '#FEF3C7' : '#FEE2E2',
            border: `0.5px solid ${showArchives ? '#FDE68A' : '#FECACA'}`,
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={selection.length === fichesFiltrees.length && fichesFiltrees.length > 0}
                onChange={toutSelectionner}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#DC2626' }}
              />
              <span style={{ fontSize: '13px', color: showArchives ? '#92400E' : '#DC2626', fontWeight: '500' }}>
                {selection.length > 0
                  ? `${selection.length} fiche${selection.length > 1 ? 's' : ''} sélectionnée${selection.length > 1 ? 's' : ''}`
                  : 'Sélectionnez les fiches à ' + (showArchives ? 'désarchiver' : 'archiver')
                }
              </span>
            </div>
            {selection.length > 0 && (
              <button
                onClick={archiverSelection}
                disabled={saving}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
                  background: saving ? '#A5B4FC' : (showArchives ? '#D97706' : '#DC2626'),
                  color: 'white'
                }}
              >
                {saving ? 'En cours...' : showArchives ? `📤 Désarchiver (${selection.length})` : `📥 Archiver (${selection.length})`}
              </button>
            )}
          </div>
        )}

        {/* Bandeau archives actif */}
        {showArchives && (
          <div style={{
            background: '#FEF3C7', border: '0.5px solid #FDE68A',
            borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            📦 Vous consultez les fiches archivées — {fiches.length} fiche{fiches.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Liste des fiches */}
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
              {fiches.length === 0
                ? showArchives ? 'Aucune fiche archivée' : 'Aucune fiche pour le moment'
                : 'Aucune fiche ne correspond à votre recherche'
              }
            </div>
            {fiches.length === 0 && !showArchives && (
              <button onClick={() => router.push('/fiches/nouvelle')} style={{
                background: c.accent, color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
                cursor: 'pointer', fontWeight: '500'
              }}>Créer la première fiche</button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '10px' : '14px'
          }}>
            {fichesFiltrees.map(fiche => {
              const isSelected = selection.includes(fiche.id)
              return (
                <div key={fiche.id}
                  onClick={() => modeArchive ? toggleSelection(fiche.id) : router.push(`/fiches/${fiche.id}`)}
                  style={{
                    background: isSelected ? (showArchives ? '#FEF3C7' : '#FEE2E2') : c.blanc,
                    borderRadius: '12px',
                    border: `0.5px solid ${isSelected ? (showArchives ? '#FDE68A' : '#FECACA') : c.bordure}`,
                    cursor: 'pointer', overflow: 'hidden',
                    display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = c.accent
                      e.currentTarget.style.boxShadow = `0 2px 12px ${c.accent}20`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = c.bordure
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {/* Checkbox mode archivage */}
                  {modeArchive && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px', zIndex: 10
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(fiche.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#DC2626' }}
                      />
                    </div>
                  )}

                  {fiche.photo_url && (
                    <img src={fiche.photo_url} alt={fiche.nom}
                      style={{
                        width: isMobile ? '100px' : '100%',
                        height: isMobile ? '100px' : '160px',
                        objectFit: 'cover', flexShrink: 0,
                        opacity: modeArchive && !isSelected ? 0.6 : 1
                      }}
                    />
                  )}
                  <div style={{ padding: isMobile ? '12px' : '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '500', color: c.texte, paddingRight: modeArchive ? '24px' : '0' }}>
                        {fiche.nom}
                      </div>
                      {fiche.categorie && (
                        <span style={{
                          background: c.accentClair, color: c.accent,
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
                      {fiche.cout_portion > 0 && fiche.prix_ttc && (() => {
                        const fc = (fiche.cout_portion / (fiche.prix_ttc / 1.10) * 100).toFixed(1)
                        const color = fc < 28 ? '#16A34A' : fc < 35 ? '#D97706' : '#DC2626'
                        const bg = fc < 28 ? '#DCFCE7' : fc < 35 ? '#FEF3C7' : '#FEE2E2'
                        return (
                          <span style={{ background: bg, color, borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '500' }}>
                            {fc}%
                          </span>
                        )
                      })()}
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
