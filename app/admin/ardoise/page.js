'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c } from '@/lib/theme' 
import { useRouter } from 'next/navigation'

export default function ArdoisePage() {
  const router = useRouter()
  
  // Tes IDs réels
  const ID_CAFE = '2aed576b-6a43-4d05-9adc-fd7dd047febc'
  const ID_RESTO = 'dc6b7c09-2bf1-4213-a48a-1c0d6b3c1c61'

  const [sites, setSites] = useState([])
  const [activeSiteId, setActiveSiteId] = useState(null)
  const [allSettings, setAllSettings] = useState([])
  const [loading, setLoading] = useState(true)

  // États métier
  const [formule, setFormule] = useState('plat_seul') 
  const [coutBoissonChaude, setCoutBoissonChaude] = useState(0)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [panier, setPanier] = useState([])
  const [nomPlat, setNomPlat] = useState('')
  const [historique, setHistorique] = useState([])

  useEffect(() => { checkAuthAndInit() }, [])

  const checkAuthAndInit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profils').select('role').eq('id', user?.id).single()
    if (!profile || !['admin', 'directeur', 'cuisine'].includes(profile.role)) { router.push('/'); return; }

    const { data: sitesData } = await supabase.from('sites').select('*').order('nom')
    const { data: settingsData } = await supabase.from('site_settings').select('*')
    
    setSites(sitesData)
    setAllSettings(settingsData)
    
    if (sitesData.length > 0) {
      const startId = sitesData[0].id
      setActiveSiteId(startId)
      setFormule(startId === ID_RESTO ? 'formule_resto' : 'plat_seul')
      fetchHistorique(startId)
    }
    setLoading(false)
  }

  const fetchHistorique = async (id) => {
    const { data } = await supabase.from('journal_ardoise').select('*').eq('site_id', id).order('created_at', { ascending: false }).limit(5)
    setHistorique(data || [])
  }

  const getSetting = (cle) => {
    const val = allSettings.find(s => s.site_id === activeSiteId && s.cle === cle)?.valeur
    return parseFloat(val) || 0
  }

  const getPrixVenteTTC = () => {
    if (activeSiteId === ID_CAFE) {
      if (formule === 'entree_seule') return 11
      if (formule === 'formule_cafe') return 21
      return 19 // Plat seul
    }
    return 29 // Restaurant
  }

  const handleSearch = async (val) => {
    setSearch(val)
    if (val.length < 2) return setResults([])
    const { data } = await supabase.from('ingredients').select('id, nom, prix_kg, unite').ilike('nom', `%${val}%`).limit(5)
    setResults(data || [])
  }

  const ajouterIngredient = (ing) => {
    if (panier.find(i => i.id === ing.id)) return
    setPanier([...panier, { id: ing.id, nom: ing.nom, prix_u: parseFloat(ing.prix_kg) || 0, unite: ing.unite || 'unité', quantite: 0 }])
    setSearch(''); setResults([])
  }

  // --- CALCULS ---
  const coutIngredients = panier.reduce((acc, ing) => acc + (parseFloat(ing.prix_u) * (parseFloat(ing.quantite) || 0)), 0)
  const aDesIngredients = panier.length > 0
  
  const fraisFixesBase = getSetting('cout_fixe_boisson') + getSetting('cout_fixe_dessert')
  const totalCoutMatiere = aDesIngredients ? (coutIngredients + fraisFixesBase + parseFloat(coutBoissonChaude || 0)) : 0
  
  const prixVenteHT = getPrixVenteTTC() / 1.1
  const foodCost = prixVenteHT > 0 ? (totalCoutMatiere / prixVenteHT) * 100 : 0

  const validerArdoise = async () => {
    if (!nomPlat || panier.length === 0) return alert("Nom et ingrédients requis")
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('journal_ardoise').insert([{
      site_id: activeSiteId,
      nom_plat: nomPlat,
      cout_total_matiere: totalCoutMatiere,
      prix_vente_ht: prixVenteHT,
      composition: panier,
      created_by: user.id
    }])
    if (!error) { alert("Plat enregistré !"); setPanier([]); setNomPlat(''); fetchHistorique(activeSiteId); }
  }

  if (loading) return <p style={{ padding: '20px' }}>Chargement...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* 1. SITES */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sites.map(s => (
          <button key={s.id} onClick={() => {setActiveSiteId(s.id); setPanier([]); setFormule(s.id === ID_RESTO ? 'formule_resto' : 'plat_seul'); setCoutBoissonChaude(0); fetchHistorique(s.id);}}
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: activeSiteId === s.id ? c.primary : '#eee', color: activeSiteId === s.id ? 'white' : '#666', fontWeight: 'bold' }}>
            {s.nom}
          </button>
        ))}
      </div>

      {/* 2. FORMULES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', background: '#f8f9fa', padding: '15px', borderRadius: '12px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>MODE :</span>
        {activeSiteId === ID_CAFE ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'entree_seule', label: 'Entrée (11€)' },
              { id: 'plat_seul', label: 'Plat (19€)' },
              { id: 'formule_cafe', label: 'Formule (21€)' }
            ].map(f => (
              <button key={f.id} onClick={() => setFormule(f.id)} 
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', backgroundColor: formule === f.id ? c.primary : 'white', color: formule === f.id ? 'white' : '#555', fontWeight: 'bold' }}>
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontWeight: 'bold', color: c.primary }}>FORMULE RESTAURANT - 29€</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
        
        <div>
          <input type="text" placeholder="Nom du plat..." value={nomPlat} onChange={(e) => setNomPlat(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid ${c.border}`, marginBottom: '20px' }} />

          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <input type="text" placeholder="🔍 Chercher un ingrédient..." value={search} onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid #ddd` }} />
            {results.length > 0 && (
              <div style={{ position: 'absolute', width: '100%', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100 }}>
                {results.map(r => <div key={r.id} onClick={() => ajouterIngredient(r)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>{r.nom} ({parseFloat(r.prix_kg).toFixed(2)}€)</div>)}
              </div>
            )}
          </div>

          {panier.map((ing, idx) => (
            <div key={ing.id} style={{ display: 'flex', gap: '15px', padding: '15px', background: 'white', marginBottom: '10px', borderRadius: '10px', border: '1px solid #eee', alignItems: 'center' }}>
              <span style={{ flex: 1, fontWeight: 'bold' }}>{ing.nom}</span>
              <input type="number" value={ing.quantite || ''} onChange={(e) => {const n = [...panier]; n[idx].quantite = e.target.value; setPanier(n)}} style={{ width: '80px', padding: '8px' }} placeholder="Qté" />
              <span style={{ width: '30px' }}>{ing.unite}</span>
              <button onClick={() => setPanier(panier.filter(i => i.id !== ing.id))} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          ))}

          {activeSiteId === ID_RESTO && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>☕ Coût Boisson Chaude :</span>
              <input type="number" value={coutBoissonChaude} onChange={(e) => setCoutBoissonChaude(e.target.value)} style={{ width: '100px', padding: '10px' }} />
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', border: `1px solid ${c.border}`, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: c.primary }}>Analyse Food Cost</h3>
          <div style={{ margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PV HT :</span><strong>{prixVenteHT.toFixed(2)} €</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Coût :</span><strong>{totalCoutMatiere.toFixed(2)} €</strong></div>
          </div>
          <div style={{ padding: '25px', borderRadius: '15px', textAlign: 'center', background: foodCost > 33 ? '#fff5f5' : '#f0fdf4', border: `1px solid ${foodCost > 33 ? '#feb2b2' : '#bbf7d0'}` }}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>FOOD COST %</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '950', color: foodCost > 33 ? '#e53e3e' : '#22c55e' }}>{foodCost.toFixed(1)}%</div>
          </div>
          <button onClick={validerArdoise} style={{ width: '100%', padding: '20px', background: c.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>
            💾 VALIDER
          </button>
        </div>
      </div>

      <div style={{ marginTop: '50px', borderTop: '2px solid #eee', paddingTop: '30px' }}>
        <h2>Historique</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {historique.map(item => (
            <div key={item.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold' }}>{item.nom_plat}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Food Cost: {((item.cout_total_matiere / item.prix_vente_ht) * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
