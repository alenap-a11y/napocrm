import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { title: '', description: '', category: '', icon: 'ti-sparkles', icon_bg: '#EEEDFE', icon_color: '#534AB7', status: 'available', cta: 'Bientôt disponible', position: 0, visible: true }

export default function AdminMarketplace() {
  const [modules, setModules] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchModules() }, [])

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
