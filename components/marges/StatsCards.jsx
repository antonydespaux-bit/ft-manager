'use client'

import { useTheme } from '../../lib/useTheme'
import { useIsMobile } from '../../lib/useIsMobile'
import { formatEuro, formatPct } from './helpers'

export default function StatsCards({ totaux, totalAchatsHT, lignesCount, margeCardColors, coverageCardColors, coveragePct }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()

  const margePctVal = totaux.margePct

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: isMobile ? 10 : 16,
      marginBottom: 24,
    }}>
      {/* CA Total */}
      <div style={{ background: c.accentClair, borderRadius: 12, padding: isMobile ? 14 : 20, border: `0.5px solid ${c.bordure}` }}>
        <div style={{ fontSize: 11, color: c.texteMuted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>CA Total (HT)</div>
        <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: c.accent }}>
          {formatEuro(totaux.caNet)}
        </div>
        <div style={{ fontSize: 11, color: c.texteMuted, marginTop: 4 }}>
          {lignesCount} plat{lignesCount !== 1 ? 's' : ''} vendus
        </div>
      </div>

      {/* Marge Théorique */}
      <div style={{ background: margeCardColors.bg ?? c.blanc, borderRadius: 12, padding: isMobile ? 14 : 20, border: `0.5px solid ${c.bordure}` }}>
        <div style={{ fontSize: 11, color: c.texteMuted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>Marge Théorique</div>
        <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: margeCardColors.color }}>
          {formatPct(margePctVal)}
        </div>
        <div style={{ fontSize: 11, color: c.texteMuted, marginTop: 4 }}>Basée sur les fiches techniques</div>
      </div>

      {/* Coût Matière */}
      <div style={{ background: c.blanc, borderRadius: 12, padding: isMobile ? 14 : 20, border: `0.5px solid ${c.bordure}` }}>
        <div style={{ fontSize: 11, color: c.texteMuted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>Coût Matière</div>
        <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: c.texte }}>
          {formatEuro(totaux.coutMatiere)}
        </div>
        <div style={{ fontSize: 11, color: c.texteMuted, marginTop: 4 }}>
          {totalAchatsHT != null && totalAchatsHT > 0 ? `Achats réels : ${formatEuro(totalAchatsHT)}` : 'Depuis les fiches techniques'}
        </div>
      </div>

      {/* Indice de Performance */}
      <div style={{ background: coverageCardColors.bg ?? c.blanc, borderRadius: 12, padding: isMobile ? 14 : 20, border: `0.5px solid ${c.bordure}` }}>
        <div style={{ fontSize: 11, color: c.texteMuted, fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>Indice de Performance</div>
        <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: coverageCardColors.color }}>
          {coveragePct != null ? `${Math.round(coveragePct)} %` : '—'}
        </div>
        <div style={{ fontSize: 11, color: c.texteMuted, marginTop: 4 }}>CA couvert par les fiches</div>
      </div>
    </div>
  )
}
