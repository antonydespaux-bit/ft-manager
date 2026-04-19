import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getClientId } from '../../../lib/supabase'

export default function KpiAvisNote({ c, isMobile }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const clientId = await getClientId()
      if (!clientId) { setLoading(false); return }
      const { data } = await supabase
        .from('avis')
        .select('stars')
        .eq('client_id', clientId)
        .eq('archive', false)
      if (cancelled) return
      const rows = (data || []).filter((r) => r.stars != null)
      const count = rows.length
      const avg = count > 0 ? rows.reduce((sum, r) => sum + Number(r.stars), 0) / count : null
      setStats({ avg, count })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const valeur = loading
    ? '…'
    : !stats || stats.count === 0
      ? '—'
      : `${stats.avg.toFixed(1)} ★`

  return (
    <div
      onClick={() => router.push('/avis')}
      style={{
        background: c.blanc, borderRadius: '12px',
        padding: isMobile ? '14px' : '20px',
        border: `0.5px solid ${c.bordure}`,
        cursor: 'pointer',
      }}
    >
      <div className="sk-label-muted" style={{ color: c.texteMuted, marginBottom: '8px' }}>Note moyenne</div>
      <div className="sk-stat-value" style={{ fontSize: isMobile ? '28px' : '36px', color: c.texte }}>{valeur}</div>
      <div style={{ fontSize: '11px', color: c.texteMuted, marginTop: '4px' }}>
        {stats?.count ? `${stats.count} avis` : 'Aucun avis'}
      </div>
    </div>
  )
}
