'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

const UNITES = ['kg', 'g', 'L', 'cl', 'ml', 'u', 'botte', 'pièce']

/**
 * Création rapide d&apos;ingrédient (cuisine). onCreated reçoit la ligne complète pour mise à jour liste locale.
 */
export default function QuickIngredientModal({ open, onClose, clientId, onCreated }) {
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [unite, setUnite] = useState('kg')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const reset = () => {
    setNom('')
    setPrix('')
    setUnite('kg')
    setErr('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    const n = nom.trim()
    if (!n) {
      setErr('Le nom est obligatoire')
      return
    }
    if (!clientId) {
      setErr('Session invalide')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const prixNum = prix.trim() ? parseFloat(prix.replace(',', '.')) : null
      const { data, error } = await supabase
        .from('ingredients')
        .insert([
          {
            nom: n,
            prix_kg: prixNum,
            unite,
            client_id: clientId,
            est_sous_fiche: false,
          },
        ])
        .select('*')
        .single()

      if (error) throw error
      onCreated?.(data)
      handleClose()
    } catch (e) {
      setErr(e.message || "Erreur à l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-ing-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 id="quick-ing-title" className="text-lg font-semibold text-zinc-900">
          Nouvel ingrédient
        </h2>
        <p className="mt-1 text-xs text-zinc-500">Ajout rapide — votre fiche en cours est conservée.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Nom *</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="Ex : Basilic frais"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Prix (€ / unité)</label>
            <input
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Unité</label>
            <select
              value={unite}
              onChange={(e) => setUnite(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {UNITES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? '…' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
