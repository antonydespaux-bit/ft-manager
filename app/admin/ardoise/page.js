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
  const [coutDessertFixe, setCoutDessertFixe] = useState(0) // Nouveau pour les desserts Café
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [panier, setPanier] = useState([])
  const [nomPlat, setNomPlat] = useState('')
  const [historique, setHistorique] = useState([])

  const [reserve, setReserve] = useState({ entree: null, plat: null })

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
    const { data } = await supabase.from('journal_ardoise').select('*').eq('site_id', id).order('created_at', { ascending: false }).limit(8)
    setHistorique(data || [])
  }

  const getSetting = (cle) => parseFloat(allSettings.find(s => s.site_id === activeSiteId && s.cle === cle)?.valeur) || 0

  const getPrixVenteTTC = () => {
    if (activeSiteId === ID_CAFE) {
      if (modeVente === 'entree_seule') return 11
      if (modeVente.includes('formule')) return 21
      return 19
    }
    return 29 
  }

  const ajouterIngredient = (ing) => {
    if (panier.find(i => i.id === ing.id)) return
    setPanier([...panier, { id: ing.id, nom: ing.nom, prix_u: parseFloat(ing.prix_kg) || 0, unite: ing.unite || 'unité', quantite: 0 }])
    setSearch(''); setResults([])
  }

  const mettreEnReserve = () => {
    if (panier.length === 0) return
    const type = modeVente.includes('entree') ? 'entree' : 'plat'
    setReserve({ ...reserve, [type]: { nom: nomPlat, ingredients: [...panier] } })
    alert(`${type.toUpperCase()} mis en mémoire !`)
  }

  const importerDepuisReserve = (type) => {
    const item = reserve[type]
    if (!item) return
    const nouveauxIng = item.ingredients.filter(ing => !panier.find(p => p.id === ing.id))
    setPanier([...panier, ...nouveauxIng])
    if (!nomPlat) setNomPlat(`Formule du jour`)
  }

  // --- CALCULS ---
  const coutIngredients = panier.reduce((acc, ing) => acc + (parseFloat(ing.prix_u) * (parseFloat(ing.quantite) || 0)), 0)
  const fraisFixesBase = getSetting('cout_fixe_boisson') + getSetting('cout_fixe_dessert')
  
  // Total = Ingrédients + Frais fixes (Pain/Beurre) + Boisson (Resto) + Dessert (Café PD)
  const totalCoutMatiere = panier.length > 0 
    ? (coutIngredients + fraisFixesBase + parseFloat(coutBoissonChaude || 0) + parseFloat(coutDessertFixe || 0)) 
    : 0

  const prixVenteHT = getPrixVenteTTC() / 1.1
  const foodCost = prixVenteHT > 0 ? (totalCoutMatiere / prixVenteHT) * 100 : 0

  if (loading) return <p style={{ padding: '20px' }}>Chargement...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* SITES */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sites.map(s => (
          <button key={s.id} onClick={() => {setActiveSiteId(s.id); setPanier([]); setModeVente(s.id === ID_RESTO ? 'formule_ep' : 'plat_seul'); setCoutDessertFixe(0); setCoutBoissonChaude(0); fetchHistorique(s.id);}}
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: activeSiteId === s.id ? c.primary : '#eee', color: activeSiteId === s.id ? 'white' : '#666', fontWeight: 'bold' }}>
            {s.nom}
          </button>
        ))}
      </div>

      {/* MODES DE VENTE */}
      <div style={{ marginBottom: '30px', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeSiteId === ID_CAFE ? (
            ['entree_seule', 'plat_seul', 'formule_ep', 'formule_pd'].map(m => (
              <button key={m} onClick={() => {setModeVente(m); if(m !== 'formule_pd') setCoutDessertFixe(0);}} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: modeVente === m ? c.primary : 'white', color: modeVente === m ? 'white' : '#555', fontWeight: 'bold' }}>
                {m === 'formule_ep' ? 'FORMULE E+P (21€)' : m === 'formule_pd' ? 'FORMULE P+D (21€)' : m.replace('_', ' ').toUpperCase()}
              </button>
            ))
          ) : (
            ['formule_ep', 'formule_pd'].map(m => (
              <button key={m} onClick={() => setModeVente(m)} style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: modeVente === m ? c.primary : 'white', color: modeVente === m ? 'white' : '#555', fontWeight: 'bold' }}>
                {m === 'formule_ep' ? 'E+P + BOISSON (29€)' : 'P+D + BOISSON (29€)'}
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
        
        <div>
          {/* SÉLECTION DESSERT FIXE (Uniquement Café Mode P+D) */}
          {activeSiteId === ID_CAFE && modeVente === 'formule_pd' && (
            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #bae6fd' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '15px' }}>CHOISIR LE DESSERT :</span>
              <button onClick={() => setCoutDessertFixe(0.76)} style={{ marginRight: '10px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #03a9f4', backgroundColor: coutDessertFixe === 0.76 ? '#03a9f4' : 'white', color: coutDessertFixe === 0.76 ? 'white' : '#03a9f4' }}>Churros (0,76€)</button>
              <button onClick={() => setCoutDessertFixe(0.78)} style={{ padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #03a9f4', backgroundColor: coutDessertFixe === 0.78 ? '#03a9f4' : 'white', color: coutDessertFixe === 0.78 ? 'white' : '#03a9f4' }}>Flan (0,78€)</button>
            </div>
          )}

          {/* IMPORTS MÉMOIRE */}
          {modeVente.includes('formule') && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {reserve.entree && modeVente === 'formule_ep' && <button onClick={() => importerDepuisReserve('entree')} style={{ background: '#e1f5fe', border: '1px solid #03a9f4', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Entrée ({reserve.entree.nom})</button>}
              {reserve.plat && <button onClick={() => importerDepuisReserve('plat')} style={{ background: '#e1f5fe', border: '1px solid #03a9f4', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Plat ({reserve.plat.nom})</button>}
            </div>
          )}

          <input type="text" placeholder="Nom du plat..." value={nomPlat} onChange={(e) => setNomPlat(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid ${c.border}`, marginBottom: '15px' }} />

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 Rechercher ingrédient..." value={search} onChange={(e) => {setSearch(e.target.value); if(e.target.value.length > 1) supabase.from('ingredients').select('id, nom, prix_kg, unite').ilike('nom', `%${e.target.value}%`).limit(5).then(({data}) => setResults(data || []))}}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid #ddd` }} />
            {results.length > 0 && (
              <div style={{ position: 'absolute', width: '100%', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100 }}>
                {results.map(r => <div key={r.id} onClick={() => ajouterIngredient(r)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>{r.nom} ({parseFloat(r.prix_kg).toFixed(2)}€)</div>)}
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
            {panier.map((ing, idx) => (
              <div key={ing.id} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f9f9f9', alignItems: 'center' }}>
                <span style={{ flex: 1, fontWeight: 'bold' }}>{ing.nom}</span>
                <input type="number" value={ing.quantite || ''} onChange={(e) => {const n = [...panier]; n[idx].quantite = e.target.value; setPanier(n)}} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <span style={{ width: '40px', fontSize: '0.8rem' }}>{ing.unite}</span>
                <button onClick={() => setPanier(panier.filter(i => i.id !== ing.id))} style={{ color: 'red', border: 'none', background: 'none' }}>✕</button>
              </div>
            ))}
          </div>

          {activeSiteId === ID_RESTO && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>☕ Coût Boisson Chaude :</span>
              <input type="number" value={coutBoissonChaude} onChange={(e) => setCoutBoissonChaude(e.target.value)} style={{ width: '80px', padding: '8px' }} />
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', border: `1px solid ${c.border}`, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: c.primary }}>{modeVente.replace('_', ' ').toUpperCase()}</h3>
          <div style={{ margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PV HT :</span><strong>{prixVenteHT.toFixed(2)} €</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Coût Total :</span><strong>{totalCoutMatiere.toFixed(2)} €</strong></div>
          </div>
          <div style={{ padding: '25px', borderRadius: '15px', textAlign: 'center', background: foodCost > 33 ? '#fff5f5' : '#f0fdf4', border: `1px solid ${foodCost > 33 ? '#feb2b2' : '#bbf7d0'}` }}>
            <div style={{ fontSize: '3rem', fontWeight: '950', color: foodCost > 33 ? '#e53e3e' : '#22c55e' }}>{foodCost.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
