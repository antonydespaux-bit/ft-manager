'use client'
import { useState, useEffect } from 'react'
import { supabase, getClientId } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme } from '../../../lib/theme.jsx'
import { useIsMobile } from '../../../lib/useIsMobile'
import { useTheme } from '../../../lib/useTheme'
import { useRole } from '../../../lib/useRole'
import { log } from '../../../lib/useLog'
import * as XLSX from 'xlsx'
import NavbarBar from '../../../components/NavbarBar'

const CATEGORIES_BAR = ['Cocktails', 'Vins', 'Bières', 'Softs', 'Champagnes', 'Spiritueux', 'Sans alcool', 'Mocktails']
const CATEGORIES_ALCOOL = ['Cocktails', 'Vins', 'Champagnes', 'Bières', 'Spiritueux']

export default function BarRecapPage() {
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saisonFiltree, setSaisonFiltree] = useState('toutes')
  const [categorieOuverte, setCategorieOuverte] = useState(null)
  const [modifArchive, setModifArchive] = useState({})
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()
  const { c } = useTheme()
  const { role } = useRole()

  const peutModifier = role === 'admin' || role === 'bar'

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/')
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/')
    }
  }

  const loadData = async () => {
    try {
      const clientId = await getClientId()
      if (!clientId) { router.push('/'); return }

      const { data, error } = await supabase
        .from('fiches_bar')
        .select('*')
        .eq('client_id', clientId)
        .neq('categorie', 'Sous-fiche')
        .eq('archive', false)
        .order('nom')

      if (error) throw error
      setFiches(data || [])
      setModifArchive({})
    } catch (err) {
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fichesFiltrees = fiches.filter(f =>
    saisonFiltree === 'toutes' || f.saison === saisonFiltree
  )

  const moyenne = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  const statsCategorie = (cat) => {
    const lignes = fichesFiltrees.filter(f => f.categorie === cat)
    if (lignes.length === 0) return null

    const tva = CATEGORIES_ALCOOL.includes(cat) ? 1.20 : 1.10
    const couts = lignes.filter(f => f.cout_portion > 0).map(f => Number(f.cout_portion))
    const prixHTs = lignes.filter(f => f.prix_ttc).map(f => f.prix_ttc / tva)
    const prixTTCs = lignes.filter(f => f.prix_ttc).map(f => Number(f.prix_ttc))
    const benefices = lignes.filter(f => f.prix_ttc && f.cout_portion).map(f => (f.prix_ttc / tva) - Number(f.cout_portion))
    const ratios = lignes.filter(f => f.prix_ttc && f.cout_portion).map(f => Number(f.cout_portion) / (f.prix_ttc / tva) * 100)

    return {
      nb: lignes.length,
      coutMoyen: moyenne(couts),
      prixHTMoyen: moyenne(prixHTs),
      prixTTCMoyen: moyenne(prixTTCs),
      beneficeMoyen: moyenne(benefices),
      ratioMoyen: moyenne(ratios)
    }
  }

  const fcColor = (fc) => {
    if (!fc) return c.texteMuted
    if (fc < 22) return '#3B6D11'
    if (fc < 28) return '#854F0B'
    return '#A32D2D'
  }

  const fcBg = (fc) => {
    if (!fc) return 'transparent'
    if (fc < 22) return '#EAF3DE'
    if (fc < 28) return '#FAEEDA'
    return '#FCEBEB'
  }

  const toggleArchive = (id) => {
    setModifArchive(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const sauvegarderArchives = async () => {
    setSaving(true)
    try {
      const clientId = await getClientId()
      if (!clientId) return

      const ids = Object.keys(modifArchive).filter(id => modifArchive[id])
      if (ids.length === 0) return

      const { error } = await supabase
        .from('fiches_bar')
        .update({ archive: true })
        .in('id', ids)
        .eq('client_id', clientId)

      if (error) throw error

      await log({
        action: 'ARCHIVAGE',
        entite: 'fiche_bar',
        entite_id: ids[0],
        entite_nom: `${ids.length} fiche(s) bar`,
        section: 'bar',
        details: `Archivage depuis récap bar — IDs: ${ids.join(', ')}`
      })

      await loadData()
    } catch (err) {
      console.error('Archive error:', err)
      alert('Erreur lors de l\'archivage')
    } finally {
      setSaving(false)
    }
  }

  const nbArchivesSelectionnes = Object.values(modifArchive).filter(Boolean).length

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const rowsRecap = CATEGORIES_BAR.map(cat => {
      const stats = statsCategorie(cat)
      if (!stats) return null
      return {
        'Catégorie': cat, 'Nb fiches': stats.nb,
        'Coût moyen / portion (€)': stats.coutMoyen.toFixed(2),
        'Prix HT moyen (€)': stats.prixHTMoyen.toFixed(2),
        'Prix TTC moyen (€)': stats.prixTTCMoyen.toFixed(2),
        'Bénéfice moyen (€)': stats.beneficeMoyen.toFixed(2),
        'Ratio moyen (%)': stats.ratioMoyen.toFixed(1)
      }
    }).filter(Boolean)
    const wsRecap = XLSX.utils.json_to_sheet(rowsRecap)
    XLSX.utils.book_append_sheet(wb, wsRecap, 'Récapitulatif Bar')
    CATEGORIES_BAR.forEach(cat => {
      const lignes = fichesFiltrees.filter(f => f.categorie === cat)
      if (!lignes.length) return
      const tva = CATEGORIES_ALCOOL.includes(cat) ? 1.20 : 1.10
      const rows = lignes.map(f => ({
        'Nom': f.nom, 'Saison': f.saison || '—',
        'Coût / portion (€)': f.cout_portion ? Number(f.cout_portion).toFixed(2) : '—',
        'Prix HT (€)': f.prix_ttc ? (f.prix_ttc / tva).toFixed(2) : '—',
        'Prix TTC (€)': f.prix_ttc ? Number(f.prix_ttc).toFixed(2) : '—',
        'Food cost (%)': f.prix_ttc && f.cout_portion ? (f.cout_portion / (f.prix_ttc / tva) * 100).toFixed(1) : '—'
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), cat.substring(0, 31))
    })
    XLSX.writeFile(wb, `recap_bar_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`)
  }

  const DetailFiches = ({ cat }) => {
    const lignes = fichesFiltrees.filter(f => f.categorie === cat)
    if (!lignes.length) return null
    const tva = CATEGORIES_ALCOOL.includes(cat) ? 1.20 : 1.10

    return isMobile ? (
      <div style={{ padding: '8px 12px', background: c.fond }}>
        {lignes.map((item) => {
          const prixHT = item.prix_ttc ? item.prix_ttc / tva : null
          const fc = prixHT && item.cout_portion ? (item.cout_portion / prixHT * 100).toFixed(1) : null
          const aArchiver = modifArchive[item.id] || false
          return (
            <div key={item.id} style={{
              background: aArchiver ? '#FAEEDA' : c.blanc,
              borderRadius: '8px', padding: '12px', marginBottom: '8px',
              border: `0.5px solid ${aArchiver ? '#FAC775' : c.bordure}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: c.texte, cursor: 'pointer', flex: 1 }}
                  onClick={() => router.push(`/bar/fiches/${item.id}`)}
                >{item.nom}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fc && <span style={{ background: fcBg(fc), color: fcColor(fc), borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' }}>{fc}%</span>}
                  {peutModifier && (
                    <input type="checkbox" checked={aArchiver} onChange={() => toggleArchive(item.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                    />
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: c.texteMuted }}>
                {item.cout_portion ? <span>Coût : {Number(item.cout_portion).toFixed(2)} €</span> : null}
                {item.prix_ttc ? <span>Prix : {Number(item.prix_ttc).toFixed(2)} €</span> : null}
                {item.saison ? <span>{item.saison}</span> : null}
              </div>
            </div>
          )
        })}
      </div>
    ) : (
      <tr>
        <td colSpan={peutModifier ? 8 : 7} style={{ padding: '0', background: c.fond }}>
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  {['Nom', 'Saison', 'Coût / portion', 'Prix HT', 'Prix TTC', 'Bénéfice', 'Food cost', ...(peutModifier ? ['Archiver'] : [])].map(h => (
                    <th key={h} style={{
                      padding: '6px 10px', textAlign: h === 'Nom' ? 'left' : 'right',
                      color: c.texteMuted, fontWeight: '500', fontSize: '11px',
                      textTransform: 'uppercase', borderBottom: `0.5px solid ${c.bordure}`
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((item, i) => {
                  const prixHT = item.prix_ttc ? item.prix_ttc / tva : null
                  const benefice = prixHT && item.cout_portion ? prixHT - item.cout_portion : null
                  const fc = prixHT && item.cout_portion ? (item.cout_portion / prixHT * 100).toFixed(1) : null
                  const aArchiver = modifArchive[item.id] || false
                  return (
                    <tr key={item.id} style={{
                      borderBottom: i < lignes.length - 1 ? `0.5px solid ${c.bordure}` : 'none',
                      background: aArchiver ? '#FAEEDA' : c.blanc
                    }}>
                      <td style={{ padding: '8px 10px', fontWeight: '500', color: c.texte, cursor: 'pointer' }}
                        onClick={() => router.push(`/bar/fiches/${item.id}`)}
                      >{item.nom}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: c.texteMuted }}>{item.saison || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: c.texte }}>{item.cout_portion ? `${Number(item.cout_portion).toFixed(2)} €` : '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: c.texte }}>{prixHT ? `${prixHT.toFixed(2)} €` : '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: c.texte }}>{item.prix_ttc ? `${Number(item.prix_ttc).toFixed(2)} €` : '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '500', color: benefice ? (benefice > 0 ? '#3B6D11' : '#A32D2D') : c.texteMuted }}>
                        {benefice ? `${benefice.toFixed(2)} €` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {fc ? <span style={{ background: fcBg(fc), color: fcColor(fc), borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' }}>{fc} %</span> : '—'}
                      </td>
                      {peutModifier && (
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <input type="checkbox" checked={aArchiver} onChange={() => toggleArchive(item.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7C3AED' }}
                          />
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>
      <NavbarBar />

      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Barre d'actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={saisonFiltree} onChange={e => setSaisonFiltree(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}`,
            fontSize: '13px', background: c.blanc, outline: 'none', color: c.texte, cursor: 'pointer',
            flex: isMobile ? 1 : 'none'
          }}>
            <option value="toutes">Toutes les saisons</option>
            {theme.saisons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <span style={{ fontSize: '12px', color: c.texteMuted }}>
            {fichesFiltrees.length} fiche{fichesFiltrees.length > 1 ? 's' : ''}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Bouton archiver — visible dès qu'une case est cochée */}
            {peutModifier && nbArchivesSelectionnes > 0 && (
              <button
                onClick={sauvegarderArchives}
                disabled={saving}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '500', border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: saving ? '#A5B4FC' : '#7C3AED',
                  color: 'white', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {saving ? 'Archivage...' : `📥 Archiver la sélection (${nbArchivesSelectionnes})`}
              </button>
            )}

            {/* Export Excel */}
            <button onClick={exportExcel} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
              border: `0.5px solid ${c.bordure}`, background: c.blanc,
              color: c.texteMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              📊 {!isMobile && 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Bandeau sélection active */}
        {peutModifier && nbArchivesSelectionnes > 0 && (
          <div style={{
            background: '#EDE9FE', border: '0.5px solid #DDD6FE',
            borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
            fontSize: '13px', color: '#7C3AED',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>📥 {nbArchivesSelectionnes} fiche{nbArchivesSelectionnes > 1 ? 's' : ''} sélectionnée{nbArchivesSelectionnes > 1 ? 's' : ''} pour archivage</span>
            <button onClick={() => setModifArchive({})} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#7C3AED', fontSize: '13px', fontWeight: '500'
            }}>Annuler</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted }}>Chargement...</div>
        ) : isMobile ? (
          <div>
            {CATEGORIES_BAR.map(cat => {
              const stats = statsCategorie(cat)
              if (!stats) return null
              const isOpen = categorieOuverte === cat
              return (
                <div key={cat} style={{ marginBottom: '8px' }}>
                  <div onClick={() => setCategorieOuverte(isOpen ? null : cat)} style={{
                    background: isOpen ? '#EDE9FE' : c.blanc,
                    borderRadius: isOpen ? '12px 12px 0 0' : '12px',
                    padding: '14px 16px', cursor: 'pointer',
                    border: `0.5px solid ${c.bordure}`,
                    borderBottom: isOpen ? 'none' : `0.5px solid ${c.bordure}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '500' }}>{cat}</span>
                        <span style={{ fontSize: '11px', color: c.texteMuted }}>{stats.nb} fiche{stats.nb > 1 ? 's' : ''}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#7C3AED' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: c.texteMuted, textTransform: 'uppercase' }}>Coût moy.</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: c.texte }}>{stats.coutMoyen > 0 ? `${stats.coutMoyen.toFixed(2)}€` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: c.texteMuted, textTransform: 'uppercase' }}>Prix TTC</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: c.texte }}>{stats.prixTTCMoyen > 0 ? `${stats.prixTTCMoyen.toFixed(2)}€` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: c.texteMuted, textTransform: 'uppercase' }}>Ratio</div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>
                          {stats.ratioMoyen > 0 ? <span style={{ color: fcColor(stats.ratioMoyen) }}>{stats.ratioMoyen.toFixed(1)}%</span> : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ border: `0.5px solid ${c.bordure}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                      <DetailFiches cat={cat} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: c.blanc, borderRadius: '12px', border: `0.5px solid ${c.bordure}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#3C3489' }}>
                  {['Catégorie', 'Nb fiches', 'Coût moy./portion', 'Prix HT moy.', 'Prix TTC moy.', 'Bénéfice moy.', 'Ratio moy.'].map(col => (
                    <th key={col} style={{
                      padding: '12px 16px', textAlign: col === 'Catégorie' ? 'left' : 'right',
                      fontSize: '11px', color: '#C4956A', fontWeight: '500',
                      textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES_BAR.map(cat => {
                  const stats = statsCategorie(cat)
                  if (!stats) return null
                  const isOpen = categorieOuverte === cat
                  return (
                    <>
                      <tr key={cat}
                        onClick={() => setCategorieOuverte(isOpen ? null : cat)}
                        style={{ borderBottom: `0.5px solid ${c.bordure}`, cursor: 'pointer', background: isOpen ? '#EDE9FE' : c.blanc }}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = c.fond }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = c.blanc }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '500' }}>{cat}</span>
                            <span style={{ fontSize: '11px', color: c.texteMuted }}>{stats.nb} fiche{stats.nb > 1 ? 's' : ''}</span>
                            <span style={{ fontSize: '11px', color: '#7C3AED', marginLeft: 'auto' }}>{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: c.texte }}>{stats.nb}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: c.texte }}>{stats.coutMoyen > 0 ? `${stats.coutMoyen.toFixed(2)} €` : '—'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: c.texte }}>{stats.prixHTMoyen > 0 ? `${stats.prixHTMoyen.toFixed(2)} €` : '—'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: c.texte }}>{stats.prixTTCMoyen > 0 ? `${stats.prixTTCMoyen.toFixed(2)} €` : '—'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', color: stats.beneficeMoyen > 0 ? '#3B6D11' : stats.beneficeMoyen < 0 ? '#A32D2D' : c.texteMuted }}>
                          {stats.beneficeMoyen !== 0 ? `${stats.beneficeMoyen.toFixed(2)} €` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {stats.ratioMoyen > 0 ? (
                            <span style={{ background: fcBg(stats.ratioMoyen), color: fcColor(stats.ratioMoyen), borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '500' }}>
                              {stats.ratioMoyen.toFixed(1)} %
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                      {isOpen && <DetailFiches key={`detail-${cat}`} cat={cat} />}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
