'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c } from '@/lib/theme' 
import { useRouter } from 'next/navigation'

export default function ArdoisePage() {
  const router = useRouter()
  const ID_CAFE = '2aed576b-6a43-4d05-9adc-fd7dd047febc'
  const ID_RESTO = 'dc6b7c09-2bf1-4213-a48a-1c0d6b3c1c61'

  const [sites, setSites] = useState([])
  const [activeSiteId, setActiveSiteId] = useState(null)
  const [allSettings, setAllSettings] = useState([])
  const [loading, setLoading] = useState(true)

  // États métier
  const [modeVente, setModeVente] = useState('plat_seul') 
  const [coutBoissonChaude, setCoutBoissonChaude] = useState(0)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [panier, setPanier] = useState([])
  const [nomPlat, setNomPlat] = useState('')
  const [historique, setHistorique] = useState([])

  // Système de réserve pour assembler la formule
  const [reserve, setReserve] = useState({ entree: null, plat: null, dessert: null })

  useEffect(() => { checkAuthAndInit() }, [])

  const checkAuthAndInit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profils').select('role').eq('id', user?.id).single()
    if (!profile || !['admin', 'directeur', 'cuisine'].includes(profile.role)) { router.push('/'); return; }
    const { data: sitesData } = await supabase.from('sites').select('*').order('nom')
    const { data: settingsData } = await supabase.from('site_settings').select('*')
    setSites(sitesData); setAllSettings(settingsData)
    if (sitesData.length > 0) {
      setActiveSiteId(sitesData[0].id)
      setModeVente(sitesData[0].id === ID_RESTO ? 'formule_ep' : 'plat_seul')
      fetchHistorique(sitesData[0].id)
    }
    setLoading(false)
  }

  const fetchHistorique = async (id) => {
    const { data } = await supabase.from('journal_ardoise').select('*').eq('site_id', id).order('created_at', { ascending: false }).limit(5)
    setHistorique(data || [])
  }

  const getSetting = (cle) => parseFloat(allSettings.find(s => s.site_id === activeSiteId && s.cle === cle)?.valeur) || 0

  const getPrixVenteTTC = () => {
    if (activeSiteId === ID_CAFE) {
      if (modeVente === 'entree_seule') return 11
      if (modeVente.includes('formule')) return 21
      return 19
    }
    return 29 // Restaurant (EP ou PD)
  }

  const ajouterIngredient = (ing) => {
    if (panier.find(i => i.id === ing.id)) return
    setPanier([...panier, { id: ing.id, nom: ing.nom, prix_u: parseFloat(ing.prix_kg) || 0, unite: ing.unite || 'unité', quantite: 0 }])
    setSearch(''); setResults([])
  }

  // --- LOGIQUE DE RÉSERVE ---
  const mettreEnReserve = () => {
    if (panier.length === 0) return
    const type = modeVente.includes('entree') ? 'entree' : modeVente.includes('dessert') ? 'dessert' : 'plat'
    setReserve({ ...reserve, [type]: { nom: nomPlat, ingredients: [...panier] } })
    alert(`${type.toUpperCase()} mis en réserve pour la formule !`)
  }

  const importerDepuisReserve = (type) => {
    const item = reserve[type]
    if (!item) return
    const nouveauxIng = item.ingredients.filter(ing => !panier.find(p => p.id === ing.id))
    setPanier([...panier, ...nouveauxIng])
    if (!nomPlat) setNomPlat(`Formule avec ${item.nom}`)
  }

  // --- CALCULS ---
  const coutIngredients = panier.reduce((acc, ing) => acc + (parseFloat(ing.prix_u) * (parseFloat(ing.quantite) || 0)), 0)
  const fraisFixesBase = getSetting('cout_fixe_boisson') + getSetting('cout_fixe_dessert')
  const totalCoutMatiere = panier.length > 0 ? (coutIngredients + fraisFixesBase + parseFloat(coutBoissonChaude || 0)) : 0
  const prixVenteHT = getPrixVenteTTC() / 1.1
  const foodCost = prixVenteHT > 0 ? (totalCoutMatiere / prixVenteHT) * 100 : 0

  if (loading) return <p>Chargement...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* SITES */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sites.map(s => (
          <button key={s.id} onClick={() => {setActiveSiteId(s.id); setPanier([]); setModeVente(s.id === ID_RESTO ? 'formule_ep' : 'plat_seul'); fetchHistorique(s.id);}}
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: activeSiteId === s.id ? c.primary : '#eee', color: activeSiteId === s.id ? 'white' : '#666', fontWeight: 'bold' }}>
            {s.nom}
          </button>
        ))}
      </div>

      {/* MODES DE VENTE */}
      <div style={{ marginBottom: '30px', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeSiteId === ID_CAFE ? (
            <>
              {['entree_seule', 'plat_seul', 'formule_ep'].map(m => (
                <button key={m} onClick={() => setModeVente(m)} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: modeVente === m ? c.primary : 'white', color: modeVente === m ? 'white' : '#555', fontWeight: 'bold' }}>
                  {m === 'formule_ep' ? 'FORMULE E+P (21€)' : m.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </>
          ) : (
            <>
              {['formule_ep', 'formule_pd'].map(m => (
                <button key={m} onClick={() => setModeVente(m)} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: modeVente === m ? c.primary : 'white', color: modeVente === m ? 'white' : '#555', fontWeight: 'bold' }}>
                  {m === 'formule_ep' ? 'E+P + BOISSON (29€)' : 'P+D + BOISSON (29€)'}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
        
        <div>
          {/* BOUTONS D'IMPORT RAPIDE (Si mode Formule) */}
          {modeVente.includes('formule') && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {reserve.entree && <button onClick={() => importerDepuisReserve('entree')} style={{ background: '#e1f5fe', border: '1px solid #03a9f4', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Ajouter l'Entrée ({reserve.entree.nom})</button>}
              {reserve.plat && <button onClick={() => importerDepuisReserve('plat')} style={{ background: '#e1f5fe', border: '1px solid #03a9f4', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Ajouter le Plat ({reserve.plat.nom})</button>}
              {reserve.dessert && <button onClick={() => importerDepuisReserve('dessert')} style={{ background: '#e1f5fe', border: '1px solid #03a9f4', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Ajouter le Dessert ({reserve.dessert.nom})</button>}
            </div>
          )}

          <input type="text" placeholder="Nom du plat / de la formule..." value={nomPlat} onChange={(e) => setNomPlat(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid ${c.border}`, marginBottom: '20px' }} />

          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <input type="text" placeholder="🔍 Chercher ingrédient..." value={search} onChange={(e) => {setSearch(e.target.value); if(e.target.value.length > 1) supabase.from('ingredients').select('id, nom, prix_kg, unite').ilike('nom', `%${e.target.value}%`).limit(5).then(({data}) => setResults(data || []))}}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid #ddd` }} />
            {results.length > 0 && (
              <div style={{ position: 'absolute', width: '100%', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100 }}>
                {results.map(r => <div key={r.id} onClick={() => ajouterIngredient(r)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>{r.nom} ({parseFloat(r.prix_kg).toFixed(2)}€)</div>)}
              </div>
            )}
          </div>

          {panier.map((ing, idx) => (
            <div key={ing.id} style={{ display: 'flex', gap: '15px', padding: '15px', background: 'white', marginBottom: '8px', borderRadius: '10px', border: '1px solid #eee', alignItems: 'center' }}>
              <span style={{ flex: 1, fontWeight: 'bold' }}>{ing.nom}</span>
              <input type="number" value={ing.quantite || ''} onChange={(e) => {const n = [...panier]; n[idx].quantite = e.target.value; setPanier(n)}} style={{ width: '80px', padding: '8px' }} />
              <button onClick={() => setPanier(panier.filter(i => i.id !== ing.id))} style={{ color: 'red', border: 'none', background: 'none' }}>✕</button>
            </div>
          ))}

          {/* AJOUTER À LA RÉSERVE (Uniquement pour composants seuls) */}
          {!modeVente.includes('formule') && panier.length > 0 && (
            <button onClick={mettreEnReserve} style={{ marginTop: '10px', background: 'none', border: `1px dashed ${c.primary}`, color: c.primary, padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
              📦 Garder ce {modeVente.replace('_seule', '')} en mémoire pour la formule
            </button>
          )}

          {modeVente.includes('formule') && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>☕ Coût Boisson Chaude :</span>
              <input type="number" value={coutBoissonChaude} onChange={(e) => setCoutBoissonChaude(e.target.value)} style={{ width: '100px', padding: '8px' }} />
            </div>
          )}
        </div>

        {/* ANALYSE */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', border: `1px solid ${c.border}`, height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h3 style={{ marginTop: 0, color: c.primary }}>{modeVente.toUpperCase()}</h3>
          <div style={{ margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PV HT :</span><strong>{prixVenteHT.toFixed(2)} €</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Coût :</span><strong>{totalCoutMatiere.toFixed(2)} €</strong></div>
          </div>
          <div style={{ padding: '20px', borderRadius: '15px', textAlign: 'center', background: foodCost > 33 ? '#fff5f5' : '#f0fdf4', border: `1px solid ${foodCost > 33 ? '#feb2b2' : '#bbf7d0'}` }}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>FOOD COST</div>
            <div style={{ fontSize: '3rem', fontWeight: '950', color: foodCost > 33 ? '#e53e3e' : '#22c55e' }}>{foodCost.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
