'use client'

import { useTheme } from '../../lib/useTheme'

const PERIODES = [
  { id: '7j', label: '7 jours' },
  { id: '30j', label: '30 jours' },
  { id: 'mois-precedent', label: 'Mois dernier' },
  { id: 'custom', label: 'Personnalisé' },
]

export default function DateSelector({ periode, dateDebut, dateFin, onPeriode, onDateDebut, onDateFin }) {
  const { c } = useTheme()

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      {PERIODES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onPeriode(id)}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: `1px solid ${periode === id ? c.accent : c.bordure}`,
            background: periode === id ? c.accent : c.blanc,
            color: periode === id ? '#fff' : c.texte,
            fontSize: 13,
            fontWeight: periode === id ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}

      {periode === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 4 }}>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => onDateDebut(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${c.bordure}`, background: c.blanc, color: c.texte, fontSize: 13 }}
          />
          <span style={{ fontSize: 13, color: c.texteMuted }}>→</span>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => onDateFin(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${c.bordure}`, background: c.blanc, color: c.texte, fontSize: 13 }}
          />
        </div>
      )}
    </div>
  )
}
