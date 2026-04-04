'use client'

import { useTheme } from '../../lib/useTheme'
import { useIsMobile } from '../../lib/useIsMobile'
import { formatEuro, formatPct } from './helpers'

export default function SalesTable({ lignes, lignesFiltrees, categories, filtreCategorie, onFiltreCategorie, triColonne, triSens, onTri, margeColor }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()

  const th = {
    padding: isMobile ? '10px 8px' : '12px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    color: c.texteMuted,
    borderBottom: `1px solid ${c.bordure}`,
    whiteSpace: 'nowrap',
  }
  const thNum = { ...th, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }
  const thSort = { ...th, cursor: 'pointer', userSelect: 'none' }
  const td = { padding: isMobile ? '10px 8px' : '12px 14px', fontSize: 14, color: c.texte, borderBottom: `1px solid ${c.bordure}` }
  const tdNum = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
  const tdMuted = { ...tdNum, color: c.texteMuted }

  function sortIndicator(col) {
    if (triColonne !== col) return ''
    return triSens === 'asc' ? ' ▲' : ' ▼'
  }

  if (lignes.length === 0) {
    return <p style={{ color: c.texteMuted, fontSize: 14 }}>Aucune vente enregistrée sur cette période.</p>
  }

  return (
    <div style={{ background: c.blanc, borderRadius: 12, border: `0.5px solid ${c.bordure}`, overflow: 'hidden' }}>
      {/* Header with category filters */}
      <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${c.bordure}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: c.texte, marginRight: 4 }}>Détail par plat</span>
        <button
          onClick={() => onFiltreCategorie('all')}
          style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
            border: `1px solid ${filtreCategorie === 'all' ? c.accent : c.bordure}`,
            background: filtreCategorie === 'all' ? c.accent : c.blanc,
            color: filtreCategorie === 'all' ? '#fff' : c.texteMuted,
            cursor: 'pointer',
          }}
        >
          Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onFiltreCategorie(cat)}
            style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
              border: `1px solid ${filtreCategorie === cat ? c.accent : c.bordure}`,
              background: filtreCategorie === cat ? c.accent : c.blanc,
              color: filtreCategorie === cat ? '#fff' : c.texteMuted,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 300 : 0 }}>
          <thead>
            <tr style={{ background: c.fond }}>
              <th style={thSort} onClick={() => onTri('designation')}>
                Désignation{sortIndicator('designation')}
              </th>
              <th style={thNum} onClick={() => onTri('quantiteVendue')}>
                Qté{sortIndicator('quantiteVendue')}
              </th>
              <th style={thNum} onClick={() => onTri('caNet')}>
                CA net{sortIndicator('caNet')}
              </th>
              {!isMobile && <th style={{ ...th, textAlign: 'right' }}>Coût matière</th>}
              {!isMobile && <th style={{ ...th, textAlign: 'right' }}>Marge brute</th>}
              <th style={thNum} onClick={() => onTri('margePct')}>
                Marge %{sortIndicator('margePct')}
              </th>
            </tr>
          </thead>
          <tbody>
            {lignesFiltrees.map((L) => {
              const mc = margeColor(L.margePct)
              return (
                <tr key={L.fiche_id}>
                  <td style={td}>
                    {L.designation}
                    {L.categorie && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: c.texteMuted, background: c.fond, borderRadius: 4, padding: '1px 5px' }}>
                        {L.categorie}
                      </span>
                    )}
                  </td>
                  <td style={tdNum}>{Number(L.quantiteVendue).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                  <td style={tdNum}>{formatEuro(L.caNet)}</td>
                  {!isMobile && <td style={tdMuted}>{formatEuro(L.coutMatiere)}</td>}
                  {!isMobile && <td style={tdNum}>{formatEuro(L.margeBrute)}</td>}
                  <td style={{ ...tdNum, color: mc.color, fontWeight: L.margePct != null ? 600 : 400 }}>
                    {formatPct(L.margePct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 600, background: c.fond }}>
              <td style={{ ...td, color: c.texte }}>Total ({lignesFiltrees.length} plat{lignesFiltrees.length !== 1 ? 's' : ''})</td>
              <td style={{ ...tdNum, color: c.texte }}>
                {Number(lignesFiltrees.reduce((s, L) => s + L.quantiteVendue, 0)).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </td>
              <td style={{ ...tdNum, color: c.texte }}>
                {formatEuro(lignesFiltrees.reduce((s, L) => s + L.caNet, 0))}
              </td>
              {!isMobile && (
                <td style={{ ...tdNum, color: c.texte }}>
                  {formatEuro(lignesFiltrees.some((L) => L.coutMatiere != null)
                    ? lignesFiltrees.reduce((s, L) => s + (L.coutMatiere ?? 0), 0)
                    : null)}
                </td>
              )}
              {!isMobile && (
                <td style={{ ...tdNum, color: c.texte }}>
                  {formatEuro(lignesFiltrees.some((L) => L.margeBrute != null)
                    ? lignesFiltrees.reduce((s, L) => s + (L.margeBrute ?? 0), 0)
                    : null)}
                </td>
              )}
              <td style={{ ...tdNum, color: c.texte }}>
                {(() => {
                  const totalCa = lignesFiltrees.reduce((s, L) => s + L.caNet, 0)
                  const totalMarge = lignesFiltrees.some((L) => L.margeBrute != null)
                    ? lignesFiltrees.reduce((s, L) => s + (L.margeBrute ?? 0), 0)
                    : null
                  return totalMarge != null && totalCa > 0 ? formatPct((totalMarge / totalCa) * 100) : '—'
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
