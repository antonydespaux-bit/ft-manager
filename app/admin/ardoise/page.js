'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c } from '../../../lib/theme'
import { useRouter } from 'next/navigation'

export default function ArdoisePage() {
  const router = useRouter()
  const [sites, setSites] = useState([])
  const [activeSiteId, setActiveSiteId] = useState(null)
  const [allSettings, setAllSettings] = useState([])
  const [loading, setLoading] = useState(true)

  // États pour la création de plat
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [panier, setPanier] = useState([])
  const [nomPlat, setNomPlat] = useState('')
  const [typePlat, setTypePlat] = useState('plat')
  const [historique, setHistorique] = useState([])

  useEffect(() => {
    checkAuthAndInit()
  }, [])

  const checkAuthAndInit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Sécurité : Vérification du rôle
    const { data: profile } = await supabase
      .from('profils')
      .select('role')
      .eq('id', user?.id)
      .single()

    const rolesAutorises = ['admin', 'directeur', 'cuisine']
    if (!profile || !rolesAutorises.includes(profile.role)) {
      alert("Accès réservé aux administrateurs et chefs.")
      router.push('/')
      return
    }

    // 2. Chargement des données (Sites + Settings)
    const { data: sitesData } = await supabase.from('sites').select('*').order('nom')
    const { data: settingsData } = await supabase.from('site_settings').select('*')
    
    setSites(sitesData)
    setAllSettings(settingsData)
    
    if (sitesData.length > 0) {
      const firstSite = sitesData[0].id
      setActiveSiteId(firstSite)
      fetchHistorique(firstSite)
    }
    setLoading(false)
  }

  // --- LOGIQUE MÉTIER ---

  const fetchHistorique = async (siteId) => {
    const { data } = await supabase
      .from('journal_ardoise')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(5)
    setHistorique(data || [])
  }

  const getSetting = (cle) => {
    return allSettings.find(s => s.site_id === activeSiteId && s.cle === cle)?.valeur || 0
  }

  const handleSearch = async (val) => {
    setSearch(val)
    if (val.length < 2) return setResults([])
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .ilike('nom', `%${val}%`)
      .limit(5)
    setResults(data || [])
  }

  const ajouterIngredient = (ing) => {
    if (panier.find(i => i.id === ing.id)) return alert("Déjà dans la liste")
    setPanier([...panier, { 
      id: ing.id, nom: ing.nom, prix_u: ing.prix_achat_ht, unite: ing.unite_gestion, quantite: 0 
    }])
    setSearch(''); setResults([])
  }

  const supprimerIngredient = (id) => setPanier(panier.filter(i => i.id !== id))

  // --- CALCULS DE MARGE ---
  const coutIngredients = panier.reduce((acc, ing) => acc + (ing.prix_u * (ing.quantite || 0)), 0)
  const coutFixe = parseFloat(getSetting('cout_fixe_boisson')) + parseFloat(getSetting('cout_fixe_dessert'))
  const coutTotalMatiere = coutIngredients + coutFixe
  
  const prixVenteTTC = getSetting('prix_formule_midi')
  const prixVenteHT = prixVenteTTC / 1.1 
  const margeBrute = prixVenteHT - coutTotalMatiere
  const ratioMarge = prixVenteHT > 0 ? (margeBrute / prixVenteHT) * 100 : 0

  const validerArdoise = async () => {
    if (!nomPlat) return alert("Nom du plat obligatoire")
    if (panier.length === 0) return alert("Ajoutez des ingrédients")

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('journal_ardoise').insert([{
      site_id: activeSiteId,
      type_plat: typePlat,
      nom_plat: nomPlat,
      cout_total_matiere: coutTotalMatiere,
      prix_vente_ht: prixVenteHT,
      composition: panier,
      created_by: user.id
    }])

    if (!error) {
      alert("✅ Plat enregistré !")
      setPanier([]); setNomPlat('');
      fetchHistorique(activeSiteId)
    }
  }

  if (loading) return <p style={{ padding: '20px' }}>Vérification des accès et chargement...</p>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: c.primary, marginBottom: '25px' }}>🍳 Programmation Ardoise</h1>

      {/* --- ONGLETS SITES --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {sites.map(site => (
          <button key={site.id} 
            onClick={() => {setActiveSiteId(site.id); setPanier([]); fetchHistorique(site.id);}}
            style={{
              padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeSiteId === site.id ? c.primary : '#eee',
              color: activeSiteId === site.id ? 'white' : '#666', fontWeight: 'bold', transition: '0.3s'
            }}>
            {site.nom}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
        
        {/* --- COLONNE GAUCHE : CONSTRUCTION --- */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <select value={typePlat} onChange={(e) => setTypePlat(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'white' }}>
              <option value="entree">Entrée du jour</option>
              <option value="plat">Plat du jour</option>
              <option value="dessert">Dessert du jour</option>
            </select>
            <input type="text" placeholder="Nom du plat (ex: Tataki de Thon)" value={nomPlat} onChange={(e) => setNomPlat(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}` }} />
          </div>

          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="🔍 Chercher un ingrédient..." value={search} onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: `2px solid ${c.primary}33`, fontSize: '1rem' }} />
            
            {results.length > 0 && (
              <div style={{ position: 'absolute', width: '100%', background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, borderRadius: '8px', marginTop: '5px' }}>
                {results.map(r => (
                  <div key={r.id} onClick={() => ajouterIngredient(r)} 
                    style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.nom}</span>
                    <span style={{ color: '#888' }}>{r.prix_achat_ht}€ / {r.unite_gestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '25px' }}>
            {panier.map((ing, index) => (
              <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'white', borderRadius: '10px', marginBottom: '10px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ flex: 1, fontWeight: '500' }}>{ing.nom}</span>
                <input type="number" placeholder="Qté" value={ing.quantite || ''} 
                  onChange={(e) => {
                    const newPanier = [...panier]; 
                    newPanier[index].quantite = parseFloat(e.target.value) || 0; 
                    setPanier(newPanier);
                  }} 
                  style={{ width: '90px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
                />
                <span style={{ width: '40px', color: '#666' }}>{ing.unite}</span>
                <span style={{ width: '80px', textAlign: 'right', fontWeight: 'bold' }}>{(ing.prix_u * ing.quantite).toFixed(2)}€</span>
                <button onClick={() => supprimerIngredient(ing.id)} style={{ border: 'none', background: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLONNE DROITE : RÉCAPITULATIF --- */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: `1px solid ${c.border}`, height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Calcul de Marge</h3>
          
          <div style={{ margin: '15px 0', fontSize: '0.95rem', color: '#444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Prix Vente HT</span>
              <span>{prixVenteHT.toFixed(2)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Coût Ingrédients</span>
              <span>{coutIngredients.toFixed(2)} €</span>
            </div>
            {coutFixe > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#e67e22' }}>
                <span>Forfaits (Boisson/Fixe)</span>
                <span>{coutFixe.toFixed(2)} €</span>
              </div>
            )}
          </div>

          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Ratio de Marge</div>
            <div style={{ fontSize: '2.8rem', fontWeight: '900', color: ratioMarge > 70 ? '#27ae60' : '#e67e22' }}>
                {ratioMarge.toFixed(1)}%
            </div>
          </div>

          <button onClick={validerArdoise}
            style={{ width: '100%', padding: '18px', borderRadius: '10px', border: 'none', backgroundColor: c.primary, color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            💾 Valider l'Ardoise
          </button>
        </div>
      </div>
{/* --- SECTION HISTORIQUE --- */}
      <div style={{ marginTop: '60px', borderTop: '2px solid #eee', paddingTop: '40px' }}>
        <h2 style={{ color: c.primary, marginBottom: '25px' }}>Derniers plats enregistrés</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {historique.map(item => (
            <div key={item.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: c.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                {item.type_plat} • {new Date(item.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '15px', height: '40px', overflow: 'hidden' }}>{item.nom_plat}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>Marge HT :</span>
                <span style={{ fontWeight: 'bold', color: (item.prix_vente_ht - item.cout_total_matiere) / item.prix_vente_ht > 0.7 ? '#27ae60' : '#e67e22' }}>
                  {(((item.prix_vente_ht - item.cout_total_matiere) / item.prix_vente_ht) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
