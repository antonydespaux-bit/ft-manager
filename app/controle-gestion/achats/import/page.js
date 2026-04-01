'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getClientId } from '../../../../lib/supabase'
import { useIsMobile } from '../../../../lib/useIsMobile'
import { useTheme } from '../../../../lib/useTheme'
import Navbar from '../../../../components/Navbar'

// ─── Helpers purs ────────────────────────────────────────────────────────────

/** Normalise une désignation pour la réconciliation (lowercase, espaces uniquement). */
function normDesig(s) {
  if (!s) return ''
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayIso() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtPrix(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

/** Retourne un string +X,X% ou -X,X%, null si non calculable. */
function fmtDelta(n) {
  if (n == null || Number.isNaN(n)) return null
  const sign = n >= 0 ? '+' : ''
  return `${sign}${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

/** Lit un File et retourne son contenu base64 (sans le préfixe data:…;base64,). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') { reject(new Error('Lecture échouée')); return }
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/** Génère un identifiant local temporaire pour les lignes (React key uniquement). */
function makeLigneId() {
  return Math.random().toString(36).slice(2)
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function AchatsImportPage() {
  const router = useRouter()
  const { c } = useTheme()
  const isMobile = useIsMobile()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authReady, setAuthReady] = useState(false)
  const [clientId, setClientId] = useState(null)

  // ── Machine d'état ────────────────────────────────────────────────────────
  // 'upload' | 'extracting' | 'review' | 'saving' | 'done'
  const [step, setStep] = useState('upload')

  // ── Fichier ───────────────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPdf, setIsPdf] = useState(false)

  // ── Métadonnées facture ───────────────────────────────────────────────────
  const [fournisseur, setFournisseur] = useState('')
  const [dateFacture, setDateFacture] = useState(yesterdayIso())
  const [numeroFacture, setNumeroFacture] = useState('')

  // ── Lignes enrichies ──────────────────────────────────────────────────────
  // Chaque ligne : { _id, designation, quantite, unite, prix_unitaire_ht,
  //                 ingredient_id|null, ingredient_nom|null,
  //                 prix_actuel|null, deltaPrix|null, reconnu, updatePrice }
  const [lignes, setLignes] = useState([])

  // ── Caches de réconciliation ──────────────────────────────────────────────
  const [fournisseurMapping, setFournisseurMapping] = useState({}) // norm → { ingredient_id }
  const [ingredientsById, setIngredientsById] = useState({})       // id   → { nom, prix_kg, unite }

  // ── UX ────────────────────────────────────────────────────────────────────
  const [error, setError] = useState('')
  const [extractError, setExtractError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [prixMajCount, setPrixMajCount] = useState(0)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null)

  // ─── Effets ───────────────────────────────────────────────────────────────

  // Auth : vérification de session, redirect si non connecté
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session) { router.replace('/'); return }
        const cid = await getClientId()
        if (!cancelled) { setClientId(cid); setAuthReady(true) }
      } catch {
        if (!cancelled) router.replace('/')
      }
    })()
    return () => { cancelled = true }
  }, [router])

  // Chargement mapping fournisseur + ingrédients une fois authentifié
  const loadReconciliation = useCallback(async () => {
    if (!clientId) return
    const [{ data: mappings }, { data: ings }] = await Promise.all([
      supabase
        .from('fournisseur_mapping')
        .select('designation_norm, ingredient_id, fournisseur')
        .eq('client_id', clientId),
      supabase
        .from('ingredients')
        .select('id, nom, prix_kg, unite')
        .eq('client_id', clientId)
        .eq('est_sous_fiche', false),
    ])
    setFournisseurMapping(
      Object.fromEntries((mappings || []).map(m => [m.designation_norm, m]))
    )
    setIngredientsById(
      Object.fromEntries((ings || []).map(i => [i.id, i]))
    )
  }, [clientId])

  useEffect(() => {
    if (authReady && clientId) loadReconciliation()
  }, [authReady, clientId, loadReconciliation])

  // ─── Réconciliation d'une ligne ───────────────────────────────────────────

  const enrichLigne = useCallback((ligne) => {
    const norm = normDesig(ligne.designation)
    const mapping = fournisseurMapping[norm]
    const ingId = mapping?.ingredient_id ?? null
    const ing = ingId ? ingredientsById[ingId] : null
    const prixActuel = ing ? Number(ing.prix_kg) : null
    const delta =
      prixActuel != null && prixActuel > 0
        ? ((Number(ligne.prix_unitaire_ht) - prixActuel) / prixActuel) * 100
        : null
    return {
      ...ligne,
      ingredient_id:   ingId,
      ingredient_nom:  ing?.nom ?? null,
      prix_actuel:     prixActuel,
      deltaPrix:       delta,
      reconnu:         !!ingId,
      updatePrice:     !!ingId,
    }
  }, [fournisseurMapping, ingredientsById])

  // ─── Extraction IA ────────────────────────────────────────────────────────

  const extractFromImage = useCallback(async (file) => {
    try {
      const base64 = await fileToBase64(file)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/achats/parse-facture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fileBase64: base64, mimeType: file.type, clientId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erreur extraction')

      setFournisseur(result.fournisseur || '')
      setDateFacture(result.date_facture || yesterdayIso())
      setNumeroFacture(result.numero_facture || '')
      const enriched = (result.lignes || []).map(l =>
        enrichLigne({
          _id:              makeLigneId(),
          designation:      l.designation || '',
          quantite:         Number(l.quantite) || 1,
          unite:            l.unite || '',
          prix_unitaire_ht: Number(l.prix_unitaire_ht) || 0,
        })
      )
      setLignes(enriched)
      setStep('review')
    } catch (err) {
      console.error('Extraction IA échouée :', err)
      setExtractError(err.message || 'Extraction échouée')
      setLignes([])
      setStep('review')
    }
  }, [clientId, enrichLigne])

  // ─── Sélection de fichier (mobile input + desktop drop partagé) ───────────

  const handleFileSelected = useCallback(async (selectedFile) => {
    if (!selectedFile) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(selectedFile.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, WebP ou PDF.')
      return
    }
    // Libérer l'ancienne URL objet si elle existe
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(selectedFile) })
    setIsPdf(selectedFile.type === 'application/pdf')
    setError('')
    setExtractError('')
    setLignes([])

    if (selectedFile.type === 'application/pdf') {
      // PDF : aperçu uniquement, saisie manuelle
      setStep('review')
    } else {
      setStep('extracting')
      await extractFromImage(selectedFile)
    }
  }, [extractFromImage])

  // FIN PARTIE 1
