import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminAide() {
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ titre: '', contenu: '', categorie: '', ordre: 0, publie: false })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('aide').select('*').order('ordre')
    setItems(data || [])
  }

  function startNew() {
    setEditId('new')
    setForm({ titre: '', contenu: '', categorie: '', ordre: items.length, publie: false })
  }

  function startEdit(item) {
    setEditId(item.id)
    setForm({ titre: item.titre, contenu: item.contenu, categorie: item.categorie || '', ordre: item.ordre, publie: item.publie })
  }

  async function save() {
    setLoading(true)
    if (editId === 'new') {
      await supabase.from('aide').insert([form])
    } else {
      await supabase.from('aide').update(form).eq('id', editId)
    }
    setEditId(null)
    setMsg('Sauvegardé ✓')
    setTimeout(() => setMsg(''), 2000)
    setLoading(false)
    fetchAll()
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('aide').delete().eq('id', id)
    fetchAll()
  }

  const s = {
    wrap: { padding: '2rem', maxWidth: 720 },
    h1: { fontSize: '18px', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-primary)' },
    btn: { padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
    card: { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' },
    label: { fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' },
    input: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' },
    textarea: { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px', minHeight: '140px', resize: 'vertical' },
  }

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={s.h1}>Centre d'aide</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</span>}
          <button onClick={startNew} style={{ ...s.btn, background: '#B8961E', color: '#fff' }}>+ Nouvel article</button>
        </div>
      </div>

      {editId && (
        <div style={{ ...s.card, border: '1px solid #B8961E', marginBottom: '1.5rem' }}>
          <label style={s.label}>Titre</label>
          <input style={s.input} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre de l'article..." />
          <label style={s.label}>Catégorie</label>
          <input style={s.input} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} placeholder="Ex: Agenda, Clients, Facturation..." />
          <label style={s.label}>Contenu</label>
          <textarea style={s.textarea} value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} placeholder="Contenu de l'article d'aide..." />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ ...s.label, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.publie} onChange={e => setForm({ ...form, publie: e.target.checked })} />
              Publié
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditId(null)} style={{ ...s.btn, background: 'transparent', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>Annuler</button>
              <button onClick={save} disabled={loading} style={{ ...s.btn, background: '#B8961E', color: '#fff' }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {item.categorie && <div style={{ fontSize: '10px', color: '#B8961E', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.categorie}</div>}
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.titre}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{item.contenu?.slice(0, 120)}{item.contenu?.length > 120 ? '...' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: item.publie ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', color: item.publie ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {item.publie ? 'Publié' : 'Brouillon'}
              </span>
              <button onClick={() => startEdit(item)} style={{ ...s.btn, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-primary)' }}>Éditer</button>
              <button onClick={() => remove(item.id)} style={{ ...s.btn, background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }}>Suppr.</button>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && !editId && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '3rem' }}>
          Aucun article — clique sur "+ Nouvel article"
        </div>
      )}
    </div>
  )
}
