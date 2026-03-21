'use client'
import { useState, useEffect } from 'react'
import { theme } from './theme.jsx'
import { supabase } from './supabase'

// Thème par défaut (Palette A Zinc/Indigo)
const defaultCouleurs = theme.couleurs

export function useTheme() {
  const [darkMode, setDarkMode] = useState(false)
  const [branding, setBranding] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') setDarkMode(true)
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.user_metadata?.client_id) return

      const { data } = await supabase
        .from('clients')
        .select('nom_etablissement, logo_url, couleur_principale, couleur_accent, couleur_fond, slug')
        .eq('id', session.user.user_metadata.client_id)
        .single()

      if (data) setBranding(data)
    } catch (err) {
      console.error('Branding load error:', err)
    }
  }

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', newValue.toString())
  }

  // Fusionner le thème par défaut avec le branding du client
  const c = darkMode ? theme.dark : {
    ...defaultCouleurs,
    ...(branding?.couleur_principale && { principal: branding.couleur_principale }),
    ...(branding?.couleur_accent && { accent: branding.couleur_accent }),
    ...(branding?.couleur_fond && { fond: branding.couleur_fond }),
  }

  return {
    c,
    darkMode,
    toggleDarkMode,
    branding,
    nomEtablissement: branding?.nom_etablissement || 'FT Manager',
    logoUrl: branding?.logo_url || null,
  }
}
