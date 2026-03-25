'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { theme, Logo, LogoBand } from '../lib/theme.jsx'

const SUPERADMIN_EMAILS = ['antony.despaux@hotmail.fr', 'antony@skalcook.com']

export default function LandingPage() {
  const router = useRouter()
  const c = theme.couleurs
  const [loading, setLoading] = useState(true)
  const [actionRoute, setActionRoute] = useState('/login')

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user

        if (!user) {
          setActionRoute('/login')
          return
        }

        const email = (user.email || '').toLowerCase().trim()
        if (SUPERADMIN_EMAILS.includes(email)) {
          setActionRoute('/superadmin')
          return
        }

        // Si l'utilisateur est connecté mais que `profils` échoue (RLS, 406, etc.),
        // on garde quand même un chemin "application" pour afficher "Aller au Dashboard".
        setActionRoute('/choix')

        try {
          const { data: profil } = await supabase
            .from('profils')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          const role = profil?.role
          if (role === 'cuisine') setActionRoute('/dashboard')
          else if (role === 'bar') setActionRoute('/bar/dashboard')
          // sinon: on laisse /choix
        } catch (e) {
          // no-op: on conserve /choix
        }
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const isConnected = actionRoute !== '/login'

  return (
    <div style={{
      minHeight: '100vh',
      background: c.fond,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '980px' }}>
        <div style={{
          background: 'white',
          border: `0.5px solid ${c.bordure}`,
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(44, 24, 16, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <LogoBand c={c} style={{ padding: '14px 22px', flex: '1 1 320px', maxWidth: '520px' }}>
              <Logo height={32} couleur="white" />
            </LogoBand>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ fontSize: '26px', fontWeight: '700', color: c.texte, marginBottom: '8px' }}>
                Skalcook
              </div>
              <div style={{ fontSize: '14px', color: c.texteMuted, lineHeight: 1.5 }}>
                Gestion des fiches techniques et préparation pour vos établissements.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '22px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(actionRoute)}
              disabled={loading}
              style={{
                background: isConnected ? c.accent : c.principal,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 22px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '260px'
              }}
            >
              {isConnected ? 'Aller au Dashboard' : 'Accéder à l\'application'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: c.texteMuted }}>
          © {new Date().getFullYear()} Skalcook
        </div>
      </div>
    </div>
  )
}
