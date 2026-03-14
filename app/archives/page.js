'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme, Logo } from '../../lib/theme.jsx'

export default function ArchivesPage() {
  const [fiches, setFiches] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('fiches')
  const router = useRouter()
  const c = theme.couleurs

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadData = async () => {
    const { data: fichesData } = await supabase
      .from('fiches')
      .select('*')
      .eq('archive', true)
      .order('nom')

    const { data: menusData } = await supabase
      .from('menus')
      .select('*')
      .eq('archive', true)
      .order('nom')

    setFiches(fichesData || [])
    setMenus(menusData || [])
    setLoading(false)
  }

  const restaurer = async (id, type) => {
    if (type === 'fiche') {
      await supabase.from('fiches').update({ archive: false }).eq('id', id)
    } else {
      await supabase.from('menus').update({ archive: false }).eq('id', id)
    }
    loadData()
  }

  const supprimer = async (id, type) => {
    if (!confirm('Supprimer définitivement ? Cette action est irréversible.')) return
    if (type === 'fiche') {
      await supabase.from('fiches').delete().eq('id', id)
    } else {
      await supabase.from('menus').delete().eq('id', id)
    }
    loadData()
  }

  const items = tab === 'fiches' ? fiches : menus

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>

      <div style={{
        background: c.principal, borderBottom: `0.5px solid ${c.accent}40`,
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px'
      }}>
        <Logo height={30} couleur="white" onClick={() => router.push('/fiches')} />
        <button onClick={() => router.push('/fiches')} style={{
          background: 'transparent', color: 'rgba(255,255,255,0.7)',
          border: '0.5px solid rgba(255,255,255,0.2)',
          borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer'
        }}>← Retour</button>
      </div>

      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['fiches', 'menus'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
                fontWeight: tab === t ? '600' : '400', cursor: 'pointer',
                background: tab === t ? c.principal : 'white',
                color: tab === t ? c.accent : c.texteMuted,
                border: `0.5px solid ${tab === t ? c.principal : c.bordure}`
              }}
            >
              {t === 'fiches' ? `Fiches (${fiches.length})` : `Menus (${menus.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px', background: 'white',
            borderRadius: '12px', border: `0.5px solid ${c.bordure}`
          }}>
            <div style={{ fontSize: '14px', color: c.texteMuted }}>
              Aucun{tab === 'fiches' ? 'e fiche' : ' menu'} archivé{tab === 'fiches' ? 'e' : ''}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', border: `0.5px solid ${c.bordure}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: c.principal }}>
                  {['Nom', 'Catégorie', 'Saison', 'Coût / portion', 'Prix TTC', 'Actions'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '11px', color: c.accent, fontWeight: '500',
                      textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={{
                    borderBottom: i < items.length - 1 ? `0.5px solid ${c.bordure}` : 'none',
                    background: 'white', opacity: 0.7
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: c.texte }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#FAEEDA', color: '#633806',
                          borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: '500'
                        }}>ARCHIVÉ</span>
                        {item.nom}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texteMuted }}>{item.categorie || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texteMuted }}>{item.saison || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texte }}>
                      {item.cout_portion ? `${Number(item.cout_portion).toFixed(2)} €` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texte }}>
                      {item.prix_ttc || item.prix_vente ? `${Number(item.prix_ttc || item.prix_vente).toFixed(2)} €` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => restaurer(item.id, tab === 'fiches' ? 'fiche' : 'menu')}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                            cursor: 'pointer', fontWeight: '500',
                            background: c.vertClair, color: c.vert,
                            border: `0.5px solid ${c.vert}40`
                          }}
                        >Restaurer</button>
                        <button
                          onClick={() => supprimer(item.id, tab === 'fiches' ? 'fiche' : 'menu')}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                            cursor: 'pointer', background: 'transparent',
                            color: '#A32D2D', border: '0.5px solid #ddd'
                          }}
                        >Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}