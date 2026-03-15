'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme, Logo } from '../../../lib/theme.jsx'
import { useIsMobile } from '../../../lib/useIsMobile'
import { useTheme } from '../../../lib/useTheme'

export default function BarArchivesPage() {
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isMobile = useIsMobile()
  const { c } = useTheme()

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadData = async () => {
    const { data } = await supabase
      .from('fiches_bar').select('*').eq('archive', true).order('nom')
    setFiches(data || [])
    setLoading(false)
  }

  const restaurer = async (id) => {
    await supabase.from('fiches_bar').update({ archive: false }).eq('id', id)
    loadData()
  }

  const supprimer = async (id) => {
    if (!confirm('Supprimer définitivement ? Cette action est irréversible.')) return
    await supabase.from('fiches_bar').delete().eq('id', id)
    loadData()
  }

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
        <button onClick={() => router.push('/bar/dashboard')} style={{
          background: 'transparent', color: 'rgba(255,255,255,0.7)',
          border: '0.5px solid rgba(255,255,255,0.2)',
          borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer'
        }}>← {!isMobile && 'Retour'}</button>
      </div>

      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ fontSize: '11px', color: c.texteMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', fontWeight: '500' }}>
          Archives Bar ({fiches.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.texteMuted }}>Chargement...</div>
        ) : fiches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: c.blanc, borderRadius: '12px', border: `0.5px solid ${c.bordure}` }}>
            <div style={{ fontSize: '14px', color: c.texteMuted }}>Aucune fiche bar archivée</div>
          </div>
        ) : isMobile ? (
          <div>
            {fiches.map(item => (
              <div key={item.id} style={{ background: c.blanc, borderRadius: '12px', padding: '16px', border: `0.5px solid ${c.bordure}`, marginBottom: '10px', opacity: 0.8 }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ background: '#FAEEDA', color: '#633806', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: '500' }}>ARCHIVÉ</span>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: c.texte, marginTop: '4px' }}>{item.nom}</div>
                  {item.categorie && <div style={{ fontSize: '12px', color: c.texteMuted }}>{item.categorie}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => restaurer(item.id)} style={{
                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer', fontWeight: '500', background: '#E8F2EF', color: '#4A7B6F', border: '0.5px solid #4A7B6F40'
                  }}>Restaurer</button>
                  <button onClick={() => supprimer(item.id)} style={{
                    padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer', background: 'transparent', color: '#A32D2D', border: '0.5px solid #ddd'
                  }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: c.blanc, borderRadius: '12px', border: `0.5px solid ${c.bordure}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#3C3489' }}>
                  {['Nom', 'Catégorie', 'Saison', 'Coût / portion', 'Prix TTC', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: i === 0 ? 'left' : 'right', fontSize: '11px', color: '#C4956A', fontWeight: '500', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fiches.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < fiches.length - 1 ? `0.5px solid ${c.bordure}` : 'none', background: c.blanc, opacity: 0.8 }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: c.texte }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#FAEEDA', color: '#633806', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: '500' }}>ARCHIVÉ</span>
                        {item.nom}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texteMuted }}>{item.categorie || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texteMuted }}>{item.saison || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texte }}>{item.cout_portion ? `${Number(item.cout_portion).toFixed(2)} €` : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: c.texte }}>{item.prix_ttc ? `${Number(item.prix_ttc).toFixed(2)} €` : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => restaurer(item.id)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', background: '#E8F2EF', color: '#4A7B6F', border: '0.5px solid #4A7B6F40' }}>Restaurer</button>
                        <button onClick={() => supprimer(item.id)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: 'transparent', color: '#A32D2D', border: '0.5px solid #ddd' }}>Supprimer</button>
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
