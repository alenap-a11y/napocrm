import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { title: '', description: '', category: '', icon: 'ti-sparkles', icon_bg: '#EEEDFE', icon_color: '#534AB7', status: 'available', cta: 'Bientôt disponible', position: 0, visible: true }

export default function AdminMarketplace() {
  const [modules, setModules] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewContent, setViewContent] = useState(null)
  const [creatingCatalogue, setCreatingCatalogue] = useState(null)

  useEffect(() => { fetchModules() }, [])

  async function openContent(mod) {
    if (mod.catalogue_deck_id) {
      const { data } = await supabase.from('napo_oracle_cartes_catalogue').select('*').eq('deck_id', mod.catalogue_deck_id).order('numero')
      const { data: deck } = await supabase.from('napo_oracle_decks_catalogue').select('fiche').eq('id', mod.catalogue_deck_id).single()
      setViewContent({ type: 'cartes', title: mod.title, items: data || [], deckId: mod.catalogue_deck_id, fiche: deck?.fiche || '' })
    } else if (mod.catalogue_theme_id) {
      const { data } = await supabase.from('napo_oracle_questions_catalogue').select('*').eq('theme_id', mod.catalogue_theme_id)
      setViewContent({ type: 'questions', title: mod.title, items: data || [] })
    }
  }

  async function saveFiche() {
    if (!viewContent?.deckId) return
    await supabase.from('napo_oracle_decks_catalogue').update({ fiche: viewContent.fiche }).eq('id', viewContent.deckId)
  }

  async function createCatalogue(mod, type, texte) {
    const lignes = texte.split('\n').map(l => l.trim()).filter(Boolean)
    if (lignes.length === 0) return
    if (type === 'cartes') {
      const { data: deck } = await supabase.from('napo_oracle_decks_catalogue').insert({ nom: mod.title }).select().single()
      if (!deck) return
      const cartes = lignes.map(l => {
        const match = l.match(/^(\d+)[.)\s-]+(.+)$/)
        return match ? { deck_id: deck.id, numero: parseInt(match[1], 10), nom: match[2].trim() } : { deck_id: deck.id, numero: null, nom: l }
      })
      await supabase.from('napo_oracle_cartes_catalogue').insert(cartes)
      await supabase.from('marketplace_modules').update({ catalogue_deck_id: deck.id }).eq('id', mod.id)
    } else {
      const { data: theme } = await supabase.from('napo_oracle_themes_catalogue').insert({ nom: mod.title }).select().single()
      if (!theme) return
      const questions = lignes.map(q => ({ theme_id: theme.id, question: q }))
      await supabase.from('napo_oracle_questions_catalogue').insert(questions)
      await supabase.from('marketplace_modules').update({ catalogue_theme_id: theme.id }).eq('id', mod.id)
    }
    setCreatingCatalogue(null)
    fetchModules()
  }

  async function fetchModules() {
    setLoading(true)
    const { data } = await supabase.from('marketplace_modules').select('*').order('position')
    setModules(data || [])
    setLoading(false)
  }

  async function save() {
    if (editing) {
      await supabase.from('marketplace_modules').update(form).eq('id', editing)
    } else {
      await supabase.from('marketplace_modules').insert(form)
    }
    setForm(EMPTY)
    setEditing(null)
    fetchModules()
  }

  async function remove(id) {
    if (!confirm('Supprimer ce module ?')) return
    await supabase.from('marketplace_modules').delete().eq('id', id)
    fetchModules()
  }

  function edit(mod) {
    setForm(mod)
    setEditing(mod.id)
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Modules Marketplace</h2>
      <div style={{ background: '#F9F9FF', border: '1px solid #EEEDFE', borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['title','Titre'],['description','Description'],['category','Catégorie'],['icon','Icône (ti-xxx)'],['status','Status'],['cta','Bouton CTA'],['position','Position']].map(([key, label]) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', display: 'block', marginBottom: 4 }}>{label}</label>
              <input
                value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #DDD', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={save} style={{ padding: '8px 20px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editing && <button onClick={() => { setForm(EMPTY); setEditing(null) }} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Annuler</button>}
        </div>
      </div>
      {loading ? <p>Chargement...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F5F5FF' }}>
              {['Pos','Titre','Catégorie','Status','Visible','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#534AB7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(mod => (
              <tr key={mod.id} style={{ borderBottom: '1px solid #EEE' }}>
                <td style={{ padding: '10px 12px' }}>{mod.position}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{mod.title}</td>
                <td style={{ padding: '10px 12px' }}>{mod.category}</td>
                <td style={{ padding: '10px 12px' }}><span style={{ background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{mod.status}</span></td>
                <td style={{ padding: '10px 12px' }}>{mod.visible ? '✅' : '❌'}</td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <button onClick={() => edit(mod)} style={{ padding: '4px 12px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Éditer</button>
                  <button onClick={() => remove(mod.id)} style={{ padding: '4px 12px', background: '#fee', color: '#c00', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Supprimer</button>
                  {(mod.catalogue_deck_id || mod.catalogue_theme_id) ? (
                    <button onClick={() => openContent(mod)} style={{ padding: '4px 12px', background: '#E1F5EE', color: '#0F6E56', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Voir contenu</button>
                  ) : (
                    <>
                      <button onClick={() => setCreatingCatalogue({ mod, type: 'cartes', texte: '' })} style={{ padding: '4px 12px', background: '#FEF3E2', color: '#A05A00', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Catalogue cartes</button>
                      <button onClick={() => setCreatingCatalogue({ mod, type: 'questions', texte: '' })} style={{ padding: '4px 12px', background: '#EEEDFE', color: '#534AB7', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Catalogue questions</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewContent(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 720, maxHeight: '85vh', overflowY: 'auto', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{viewContent.title}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#666' }}>
              {viewContent.type === 'cartes' ? `${viewContent.items.length} cartes` : `${viewContent.items.length} questions`}
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 40%', maxHeight: '65vh', overflowY: 'auto' }}>
              {viewContent.items.map(item => (
                <li key={item.id} style={{ fontSize: 13, padding: '6px 10px', background: '#F7F7FB', borderRadius: 6 }}>
                  {viewContent.type === 'cartes' ? `${item.numero} — ${item.nom}` : item.question}
                </li>
              ))}
            </ul>
            {viewContent.type === 'cartes' && (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#534AB7', display: 'block', marginBottom: 4 }}>Fiche descriptive</label>
                <textarea
                  value={viewContent.fiche}
                  onChange={e => setViewContent(v => ({ ...v, fiche: e.target.value }))}
                  rows={8}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #DDD', fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
                <button onClick={saveFiche} style={{ marginTop: 6, padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Enregistrer la fiche</button>
              </div>
            )}
            </div>
            <button onClick={() => setViewContent(null)} style={{ marginTop: 16, padding: '6px 16px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Fermer</button>
          </div>
        </div>
      )}
      {creatingCatalogue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setCreatingCatalogue(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{creatingCatalogue.mod.title}</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#666' }}>
              {creatingCatalogue.type === 'cartes' ? 'Une carte par ligne, format "numero. nom"' : 'Une question par ligne'}
            </p>
            <textarea
              value={creatingCatalogue.texte}
              onChange={e => setCreatingCatalogue(c => ({ ...c, texte: e.target.value }))}
              rows={10}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #DDD', fontSize: 13, boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setCreatingCatalogue(null)} style={{ flex: 1, padding: '8px 0', background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Annuler</button>
              <button onClick={() => createCatalogue(creatingCatalogue.mod, creatingCatalogue.type, creatingCatalogue.texte)} style={{ flex: 1, padding: '8px 0', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Créer le catalogue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
