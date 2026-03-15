'use client'
import { useState, useEffect, useRef } from 'react'

export function useAutosave(key, data, interval = 60000) {
  const [hasDraft, setHasDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const intervalRef = useRef(null)

  // Vérifier si un brouillon existe au chargement
  useEffect(() => {
    const draft = localStorage.getItem(key)
    if (draft) {
      setHasDraft(true)
    }
  }, [key])

  // Sauvegarde automatique toutes les X ms
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (data && Object.keys(data).length > 0) {
        localStorage.setItem(key, JSON.stringify({
          ...data,
          savedAt: new Date().toISOString()
        }))
        setLastSaved(new Date())
      }
    }, interval)

    return () => clearInterval(intervalRef.current)
  }, [key, data, interval])

  const getDraft = () => {
    const draft = localStorage.getItem(key)
    return draft ? JSON.parse(draft) : null
  }

  const clearDraft = () => {
    localStorage.removeItem(key)
    setHasDraft(false)
    setLastSaved(null)
  }

  return { hasDraft, lastSaved, getDraft, clearDraft }
}
