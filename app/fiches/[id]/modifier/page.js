'use client'
import { useState, useEffect } from 'react'
import { supabase, getParametres } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { theme, Logo } from '../../../../lib/theme.jsx'
import { useIsMobile } from '../../../../lib/useIsMobile'
import { useTheme } from '../../../../lib/useTheme'
import { useAutosave } from '../../../../lib/useAutosave'
import { log } from '../../../../lib/useLog'
import { ALLERGENES } from '../../../../lib/allergenes'
import IngredientSearch from '../../../../components/IngredientSearch'

const isIngredientPossible = (cat) => cat === 'Sous-fiche' || cat === 'Accompagnements'

export default function ModifierFiche() {
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState('Plats')
  const [nbPortions, setNbPortions] = useState('')
  const [uniteProduction, setUniteProduction] = useState('u') // kg, L, u, portions
  const [prixTTC, setPrixTTC] = useState('')
  const [description, setDescription] = useState('')
  const [saison, setSaison] = useState('Printemps 2026')
  const [allergenes, setAllergenes] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoExistante, setPhotoExistante] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [listeIngredients, setListeIngredients] = useState([])
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  
  const router = useRouter()
  const params_route = useParams()
  const { c } = useTheme()
  const categories = [...theme.categories, 'Sous-fiche']
  const isMobile = useIsMobile()
  const isSousFiche = categorie === 'Sous-fiche'

  const autosaveData = { nom, categorie, nbPortions, prixTTC, description, saison, allergenes, ingredients, uniteProduction }
  const { hasDraft, lastSaved, getDraft, clearDraft } = useAutosave(`modifier-fiche-${params_route.id}`, autosaveData, 60000)

  useEffect(() => {
    checkUser()
    loadData()
    loadParams()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const loadParams = async () => {
    const p = await getParametres()
    setParams(p)
  }

  const loadData = async () => {
    const { data: ficheData } = await supabase.from('fiches').select('*').eq('id', params_route.id).single()
    if (!ficheData) { router.push('/fiches'); return }

    setNom(ficheData.nom)
    setCategorie(ficheData.categorie || 'Plats')
    setNbPortions(ficheData.nb_portions || '')
    setPrixTTC(ficheData.prix_ttc || '')
    setDescription(ficheData.description || '')
    setSaison(ficheData.saison || 'Printemps 2026')
    setAllergenes(ficheData.allergenes || [])
    if (ficheData.photo_url) { setPhotoExistante(ficheData.photo_url); setPhotoPreview(ficheData.photo_url) }

    // Récupérer l'unité de production depuis la table ingredients si elle existe
    const { data: ingLie } = await supabase.from('ingredients').select('unite').eq('fiche_id', params_route.id).single()
    if (ingLie) setUniteProduction(ingLie.unite || 'u')

    const { data: ingsData } = await supabase
      .from('fiche_ingredients')
      .select(`quantite, unite, ingredients (id, nom, prix_kg, unite)`)
      .eq('fiche_id', params_route.id)

    setIngredients((ingsData || []).map(i => ({
      ingredient_id: i.ingredients?.id || '',
      nom: i.ingredients?.nom || '',
      quantite: i.quantite,
      unite: i.unite || i.ingredients?.unite || 'kg'
    })))

    const { data: liste } = await supabase.from('ingredients').select('*').order('nom').limit(5000)
    setListeIngredients(liste || [])
    setLoading(false)
  }

  const restaurerBrouillon = () => {
    const draft = getDraft()
    if (!draft) return
    setNom(draft.nom || '')
    setCategorie(draft.categorie || 'Plats')
    setNbPortions(draft.nbPortions || '')
    setUniteProduction(draft.uniteProduction || 'u')
    setPrixTTC(draft.prixTTC || '')
    setDescription(draft.description || '')
    setSaison(draft.saison || 'Printemps 2026')
    setAllergenes(draft.allergenes || [])
    setIngredients(draft.ingredients || [])
    setDraftRestored(true)
  }

  const toggleAllergene = (id) => {
    setAllergenes(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const supprimerPhoto = async () => {
    if (photoExistante) {
      const path = photoExistante.split('/').pop()
      await supabase.storage.from('fiches-photos').remove([path])
      await supabase.from('fiches').update({ photo_url: null }).eq('id', params_route.id)
    }
    setPhoto(null); setPhotoPreview(null); setPhotoExistante(null)
  }

  const ajouterIngredient = () => {
    setIngredients([...ingredients, { ingredient_id: '', nom: '', quantite: '', unite: 'kg' }])
  }

  const supprimerIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const modifierIngredient = (index, champ, valeur) => {
    const nouveaux = [...ingredients]
    nouveaux[index][champ] = valeur
    if (champ === 'ingredient_id') {
      const ing = listeIngredients.find(i => i.id === valeur)
      if (ing) { nouveaux[index].nom = ing.nom; nouveaux[index].unite = ing.unite || 'kg' }
    }
    setIngredients(nouveaux)
  }

  const calculerCout = () => {
    return ingredients.reduce((total, ing) => {
      const ingData = listeIngredients.find(i => i.id === ing.ingredient_id)
      if (!ingData?.prix_kg || !ing.quantite) return total
      
      let q = parseFloat(ing.quantite)
      let coef = 1
      if (ing.unite === 'g' || ing.unite === 'ml') coef = 0.001
      if (ing.unite === 'cl') coef = 0.01

      return total + (ingData.prix_kg * q * coef)
    }, 0)
  }

  const foodCost = () => {
    const cout = calculerCout()
    if (!prixTTC || !cout || !nbPortions) return null
    return (cout / parseFloat(nbPortions) / (parseFloat(prixTTC) / 1.10) * 100).toFixed(1)
  }

  const prixIndicatif = () => {
    const cout = calculerCout()
    if (!cout || !nbPortions) return null
    const coutPortion = cout / parseFloat(nbPortions)
    const seuil = parseFloat(params['seuil_vert_cuisine'] || 28) / 100
    const tva = 1 + parseFloat(params['tva_restauration'] || 10) / 100
    return (coutPortion / seuil * tva).toFixed(2)
  }

  const handleSubmit = async () => {
    if (!nom) { setError('Le nom est obligatoire'); return }
    setSaving(true)
    setError('')

    const cout = calculerCout()
    const coutPortion = nbPortions ? (cout / parseFloat(nbPortions)) : null
    let photoUrl = photoExistante

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${params_route.id}.${ext}`
      const { error: errPhoto } = await supabase.storage.from('fiches-photos').upload(path, photo, { upsert: true })
      if (!errPhoto) {
        const { data: urlData } = supabase.storage.from('fiches-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    await supabase.from('fiches').update({
      nom, categorie,
      nb_portions: nbPortions ? parseFloat(nbPortions) : null,
      prix_ttc: isSousFiche ? null : (prixTTC ? parseFloat(prixTTC) : null),
      description, saison, allergenes, photo_url: photoUrl,
      cout_portion: coutPortion, updated_at: new Date().toISOString()
    }).eq('id', params_route.id)

    await supabase.from('fiche_ingredients').delete().eq('fiche_id', params_route.id)

    const ingredientsAInserer = ingredients
      .filter(i => i.ingredient_id && i.quantite)
      .map(i => ({ fiche_id: params_route.id, ingredient_id: i.ingredient_id, quantite: parseFloat(i.quantite), unite: i.unite }))

    if (ingredientsAInserer.length > 0) {
      await supabase.from('fiche_ingredients').insert(ingredientsAInserer)
    }

    if (isIngredientPossible(categorie) && coutPortion) {
      const { data: ingExistant } = await supabase.from('ingredients').select('id').eq('fiche_id', params_route.id).single()
      
      const payloadIngredient = {
        nom, 
        prix_kg: parseFloat(coutPortion),
        unite: isSousFiche ? uniteProduction : 'portions', 
        est_sous_fiche: true, 
        fiche_id: params_route.id
      }

      if (ingExistant) {
        await supabase.from('ingredients').update(payloadIngredient).eq('fiche_id', params_route.id)
      } else {
        await supabase.from('ingredients').insert([payloadIngredient])
      }
    }

    await log({
      action: 'MODIFICATION', entite: 'fiche', entite_id: params_route.id,
      entite_nom: nom, section: 'cuisine',
      details: `Catégorie: ${categorie}, Saison: ${saison}`
    })

    clearDraft()
    router.push(`/fiches/${params_route.id}`)
  }

  const fc = foodCost()
  const prixIndic = prixIndicatif()
  const seuilVert = parseFloat(params['seuil_vert_cuisine'] || 28)
  const seuilOrange = parseFloat(params['seuil_orange_cuisine'] || 35)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.fond }}>
      <div style={{ fontSize: '14px', color: c.texteMuted }}>Chargement...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: c.fond }}>
      {/* Header */}
      <div style={{
        background: c.principal, borderBottom: `0.5px solid ${c.accent}40`,
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo height={28} couleur="white" onClick={() => router.push('/dashboard')} />
          <button onClick={() => router.push(`/fiches/${params_route.id}`)} style={{
            background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)'
          }}>← Retour</button>
          {!isMobile && <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>Modifier — {nom}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lastSaved && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{!isMobile && `Sauvegardé à ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}{isMobile && '✓'}</span>}
          <button onClick={handleSubmit} disabled={saving} style={{
            background: saving ? c.texteMuted : c.accent, color: c.principal, border: 'none',
            borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer'
          }}>
            {saving ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
        {hasDraft && !draftRestored && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#633806' }}>📋 Un brouillon a été trouvé</div>
              <div style={{ fontSize: '12px', color: '#854F0B', marginTop: '2px' }}>Restaurer vos modifications ?</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={restaurerBrouillon} style={{ padding: '8px 14px', background: '#854F0B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Restaurer</button>
              <button onClick={() => clearDraft()} style={{ padding: '8px 14px', background: 'transparent', color: '#854F0B', border: '0.5px solid #FAC775', borderRadius: '8px', fontSize: '12px' }}>Ignorer</button>
            </div>
          </div>
        )}

        {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {/* Photo */}
        <div style={{ background: c.blanc, borderRadius: '12px', padding: isMobile ? '16px' : '24px', border: `0.5px solid ${c.bordure}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: c.texteMuted, textTransform: 'uppercase', marginBottom: '14px' }}>Photo</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={photoPreview} alt="Aperçu" style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                <button onClick={supprimerPhoto} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            ) : null}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ fontSize: '12px' }} />
          </div>
        </div>

        {/* Informations générales */}
        <div style={{ background: c.blanc, borderRadius: '12px', padding: isMobile ? '16px' : '24px', border: `0.5px solid ${c.bordure}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: c.texteMuted, textTransform: 'uppercase', marginBottom: '14px' }}>Infos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="Nom du plat" value={nom} onChange={e => setNom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }}>
                {categories.map(cat => <option key={cat}>{cat}</option>)}
              </select>
              <select value={saison} onChange={e => setSaison(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }}>
                {theme.saisons.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: c.texteMuted }}>{isSousFiche ? 'Rendement total' : 'Portions'}</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                   <input type="number" value={nbPortions} onChange={e => setNbPortions(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }} />
                   {isSousFiche && (
                     <select value={uniteProduction} onChange={e => setUniteProduction(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }}>
                       <option value="kg">kg</option>
                       <option value="L">L</option>
                       <option value="u">u</option>
                     </select>
                   )}
                </div>
              </div>
              {!isSousFiche && (
                <div>
                  <label style={{ fontSize: '11px', color: c.texteMuted }}>Prix de vente TTC (€)</label>
                  <input type="number" step="0.01" value={prixTTC} onChange={e => setPrixTTC(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ingrédients */}
        <div style={{ background: c.blanc, borderRadius: '12px', padding: isMobile ? '16px' : '24px', border: `0.5px solid ${c.bordure}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: c.texteMuted, textTransform: 'uppercase', marginBottom: '14px' }}>Ingrédients</div>
          {ingredients.map((ing, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ flex: 2, minWidth: isMobile ? '100%' : 'auto' }}>
                <IngredientSearch ingredients={listeIngredients} value={ing.ingredient_id} onChange={val => modifierIngredient(index, 'ingredient_id', val)} />
              </div>
              <input type="number" step="0.01" value={ing.quantite} placeholder="Qté" onChange={e => modifierIngredient(index, 'quantite', e.target.value)} style={{ width: '70px', padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }} />
              <select value={ing.unite} onChange={e => modifierIngredient(index, 'unite', e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `0.5px solid ${c.bordure}` }}>
                {['kg', 'g', 'L', 'cl', 'ml', 'u', 'botte', 'portions'].map(u => <option key={u}>{u}</option>)}
              </select>
              <button onClick={() => supprimerIngredient(index)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          ))}
          <button onClick={ajouterIngredient} style={{ marginTop: '10px', padding: '10px', background: c.vertClair, color: c.vert, border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>+ Ajouter un ingrédient</button>
        </div>

        {/* Allergènes */}
        <div style={{ background: c.blanc, borderRadius: '12px', padding: '24px', border: `0.5px solid ${c.bordure}`, marginBottom: '12px' }}>
           <div style={{ fontSize: '13px', fontWeight: '500', color: c.texteMuted, textTransform: 'uppercase', marginBottom: '14px' }}>Allergènes</div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
             {ALLERGENES.map(a => (
               <div key={a.id} onClick={() => toggleAllergene(a.id)} style={{ padding: '8px', borderRadius: '8px', border: `0.5px solid ${allergenes.includes(a.id) ? c.accent : c.bordure}`, cursor: 'pointer', background: allergenes.includes(a.id) ? c.accentClair : 'none', fontSize: '12px' }}>
                 {a.emoji} {a.label}
               </div>
             ))}
           </div>
        </div>

        {/* Récapitulatif */}
        <div style={{ background: c.blanc, borderRadius: '12px', padding: '20px', border: `0.5px solid ${c.bordure}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ background: c.fond, padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: c.texteMuted }}>COÛT TOTAL</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{calculerCout().toFixed(2)} €</div>
          </div>
          {!isSousFiche && fc && (
            <div style={{ background: fc < seuilVert ? '#EAF3DE' : '#FCEBEB', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: c.texteMuted }}>FOOD COST</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{fc} %</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
