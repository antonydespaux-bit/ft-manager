'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { theme, Logo } from '../../lib/theme.jsx'

export default function ParametresPage() {
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const c = theme.couleurs

  useEffect(() => {
    checkUser()
    loadParams()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadParams = async () => {
    const { data } = await supabase.from('parametres').select('*')
    const obj = {}
    data?.forEach(p => { obj[p.cle] = p.valeur })
    setParams(obj)
    setLoading(false)
  }

  const updateParam = (cle, valeur) => {
    setParams(prev => ({ ...prev, [cle]: valeur }))
  }

  const handleSave = async () => {
    setSaving(true)
    for (const [cle, valeur] of Object.entries(params)) {
      await supabase
        .from('parametres')
        .upsert({ cle, valeur }, { onConflict: 'cle' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const Section = ({ titre, children }) => (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '24px',
      border: `0.5px solid ${c.bordure}`, marginBottom: '16px'
    }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: c.texteMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
        {titre}
      </div>
      {children}
    </div>
  )

  const Champ = ({ label, cle, type = 'text', suffix = '', description = '' }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', color: c.texteMuted, fontWeight: '500', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      {description && (
        <div style={{ fontSize: '11px', color: c.texteMuted, marginBottom: '6px', opacity: 0.8 }}>{description}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type={type}
          value={params[cle] || ''}
          onChange={e => updateParam(cle, e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: '8px',
            border: `0.5px solid ${c.bordure}`, fontSize: '14px',
            outline: 'none', color: c.texte, width: type === 'number' ? '100px' : '100%'
          }}
        />
        {suffix && <span style={{ fontSize: '13px', color: c.texteMuted }}>{suffix}</span>}
      </div>
    </div>
  )

  const prixIndicatif = (coutPortion) => {
    const seuil = parseFloat(params['seuil_vert_cuisine'] || 28) / 100
    const tva = 1 + parseFloat(params['tva_restauration'] || 10) / 100
    if (!coutPortion || !seuil) return null
    return (coutPortion / seuil * tva).toFixed(2)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.fond }}>
      <div style={{ fontSize: '14px', color: c.texteMuted }}>Chargement...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>

      <div style={{
        background: c.principal, borderBottom: `0.5px solid ${c.accent}40`,
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px'
      }}>
       <Logo height={30} couleur="white" onClick={() => router.push('/fiches')} />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: '13px', color: '#9FE1CB', fontWeight: '500' }}>
              Paramètres sauvegardés !
            </span>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            background: saving ? c.texteMuted : c.accent,
            color: c.principal, border: 'none', borderRadius: '8px',
            padding: '8px 20px', fontSize: '13px', fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button onClick={() => router.push('/fiches')} style={{
            background: 'transparent', color: 'rgba(255,255,255,0.7)',
            border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer'
          }}>← Retour</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>

        {/* Établissement */}
        <Section titre="Établissement">
          <Champ label="Nom de l'établissement" cle="nom_etablissement" />
          <Champ label="Adresse" cle="adresse" />
          <Champ label="Chef de cuisine" cle="chef_cuisine" description="Apparaîtra sur les fiches imprimées" />
        </Section>

        {/* Seuils cuisine */}
        <Section titre="Seuils food cost — Cuisine">
          <div style={{
            background: c.fond, borderRadius: '8px', padding: '12px 14px',
            fontSize: '12px', color: c.texteMuted, marginBottom: '16px',
            border: `0.5px solid ${c.bordure}`
          }}>
            Ces seuils définissent les couleurs dans l'application : vert = bon, orange = attention, rouge = trop élevé.
            Le seuil vert sert aussi à calculer le <strong style={{ color: c.texte }}>prix de vente indicatif</strong>.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Champ label="Seuil vert — en dessous de" cle="seuil_vert_cuisine" type="number" suffix="%" description="Objectif idéal" />
            <Champ label="Seuil orange — en dessous de" cle="seuil_orange_cuisine" type="number" suffix="%" description="Maximum acceptable" />
          </div>
          <div style={{
            background: '#E1F5EE', borderRadius: '8px', padding: '12px 14px',
            fontSize: '13px', color: '#085041', border: '0.5px solid #9FE1CB'
          }}>
            Prix indicatif = Coût portion ÷ {params['seuil_vert_cuisine'] || 28}% × {100 + parseFloat(params['tva_restauration'] || 10)}%
            {' '}→ Ex: pour un coût de 5,00 € → prix indicatif = <strong>{prixIndicatif(5)} €</strong>
          </div>
        </Section>

        {/* Seuils boissons */}
        <Section titre="Seuils food cost — Boissons">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Champ label="Seuil vert — en dessous de" cle="seuil_vert_boissons" type="number" suffix="%" description="Objectif idéal" />
            <Champ label="Seuil orange — en dessous de" cle="seuil_orange_boissons" type="number" suffix="%" description="Maximum acceptable" />
          </div>
        </Section>

        {/* TVA */}
        <Section titre="Taux de TVA">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Champ label="TVA restauration" cle="tva_restauration" type="number" suffix="%" />
            <Champ label="TVA alcool" cle="tva_alcool" type="number" suffix="%" />
            <Champ label="TVA sans alcool" cle="tva_sans_alcool" type="number" suffix="%" />
          </div>
        </Section>

        {/* Saisons */}
        <Section titre="Saison par défaut">
          <div>
            <label style={{ fontSize: '12px', color: c.texteMuted, fontWeight: '500', display: 'block', marginBottom: '6px' }}>
              Saison sélectionnée par défaut à la création d'une fiche
            </label>
            <select
              value={params['saison_defaut'] || 'Printemps 2026'}
              onChange={e => updateParam('saison_defaut', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: `0.5px solid ${c.bordure}`, fontSize: '14px',
                background: 'white', outline: 'none', color: c.texte
              }}
            >
              {theme.saisons.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </Section>

      </div>
    </div>
  )
}