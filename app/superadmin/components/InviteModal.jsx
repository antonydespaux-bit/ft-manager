'use client'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '0.5px solid #E4E4E7', fontSize: '14px',
  outline: 'none', color: '#18181B', background: 'white'
}
const labelStyle = {
  fontSize: '12px', color: '#71717A', fontWeight: '500',
  display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'
}

export default function InviteModal({ client, email, nom, sending, onEmailChange, onNomChange, onSubmit, onClose }) {
  if (!client) return null

  const canSubmit = email.trim() && nom.trim() && !sending

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(9,9,11,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'white', borderRadius: '14px',
        border: '0.5px solid #E4E4E7', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        padding: '20px'
      }}>
        <div style={{ fontSize: '17px', fontWeight: '600', color: '#18181B', marginBottom: '6px' }}>
          Inviter Admin
        </div>
        <div style={{ fontSize: '13px', color: '#71717A', marginBottom: '16px' }}>
          Établissement: <strong style={{ color: '#18181B' }}>{client.nom_etablissement}</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
              placeholder="admin@etablissement.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input type="text" value={nom} onChange={e => onNomChange(e.target.value)}
              placeholder="Prénom Nom" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} disabled={sending} style={{
            background: 'white', color: '#71717A', border: '0.5px solid #E4E4E7', borderRadius: '8px',
            padding: '10px 14px', fontSize: '13px', cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.6 : 1
          }}>Annuler</button>
          <button onClick={onSubmit} disabled={!canSubmit} style={{
            background: canSubmit ? '#6366F1' : '#A5B4FC', color: 'white', border: 'none', borderRadius: '8px',
            padding: '10px 14px', fontSize: '13px', fontWeight: '500',
            cursor: canSubmit ? 'pointer' : 'not-allowed'
          }}>{sending ? 'Envoi…' : 'Inviter'}</button>
        </div>
      </div>
    </div>
  )
}
